'use client';

import { useEffect, useRef, useState } from 'react';
import {
  subscribeComics,
  subscribeRecentGuruActivities,
  subscribeStudentProgress,
  subscribeStudents,
  type GuruRecentActivity,
} from '../services/firestoreService';
import { normalizeComicProgressDocuments, normalizeStudentDocuments } from '../services/studentNormalization';
import type { FirestoreOperationFailure } from '../services/firestoreDiagnostics';
import { buildStudentRow, buildDashboardSummary } from '../services/studentUtils';
import type { ComicDocument, UserDocument } from '@/types/firestore';
import type { DashboardSummary, StudentRow } from '../types';

interface GuruDashboardState {
  students: UserDocument[];
  comics: ComicDocument[];
  rows: StudentRow[];
  summary: DashboardSummary;
  recentActivities: GuruRecentActivity[];
  recentActivityLoading: boolean;
  loading: boolean;
  errors: FirestoreOperationFailure[];
}

const EMPTY_SUMMARY: DashboardSummary = {
  totalStudents: 0,
  totalComics: 0,
  activeStudents: 0,
  studentsCompleted: 0,
  progressDocuments: 0,
  totalCompleted: 0,
  completionRate: 0,
  averageProgress: 0,
};

export function useGuruDashboard() {
  const [state, setState] = useState<GuruDashboardState>({
    students: [],
    comics: [],
    rows: [],
    summary: EMPTY_SUMMARY,
    recentActivities: [],
    recentActivityLoading: true,
    loading: true,
    errors: [],
  });

  const studentsRef = useRef<UserDocument[]>([]);
  const comicsRef = useRef<ComicDocument[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  const rebuildRows = (students: UserDocument[], comics: ComicDocument[], progressMap: Map<string, import('@/types/firestore').ComicProgressDocument[]>) => {
    const rows = students.map((s) => buildStudentRow(s, progressMap.get(s.uid) ?? []));
    const summary = buildDashboardSummary(rows, comics.length);
    setState((prev) => ({ ...prev, rows, summary }));
  };

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true }));
    const progressMap = new Map<string, import('@/types/firestore').ComicProgressDocument[]>();
    const progressListeners = new Map<string, { token: object; unsubscribe: (() => void) | null }>();
    const progressReady = new Set<string>();
    const progressFailures = new Map<string, FirestoreOperationFailure>();
    let studentsReady = false;
    let comicsReady = false;

    const rebuildIfReady = () => {
      const allProgressReady = studentsRef.current.every((student) => progressReady.has(student.uid));
      if (studentsReady && comicsReady && allProgressReady) {
        rebuildRows(studentsRef.current, comicsRef.current, progressMap);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    const syncProgressListeners = (students: UserDocument[]) => {
      const studentUids = new Set(students.map((student) => student.uid).filter(Boolean));

      progressListeners.forEach((listener, uid) => {
        if (studentUids.has(uid)) return;
        listener.unsubscribe?.();
        progressListeners.delete(uid);
        progressReady.delete(uid);
        progressFailures.delete(uid);
        progressMap.delete(uid);
      });

      studentUids.forEach((uid) => {
        if (progressListeners.has(uid)) return;

        const token = {};
        progressListeners.set(uid, { token, unsubscribe: null });
        progressReady.delete(uid);
        progressMap.set(uid, []);
        const unsubscribe = subscribeStudentProgress(
          uid,
          (progress) => {
            if (!active || progressListeners.get(uid)?.token !== token) return;
            progressMap.set(uid, normalizeComicProgressDocuments(uid, progress));
            progressReady.add(uid);
            progressFailures.delete(uid);
            setState((prev) => ({
              ...prev,
              errors: [
                ...prev.errors.filter((failure) => failure.operation !== 'subscribeStudentProgress'),
                ...Array.from(progressFailures.values()),
              ],
            }));
            rebuildIfReady();
          },
          (failure) => {
            if (!active || progressListeners.get(uid)?.token !== token) return;
            progressReady.add(uid);
            progressFailures.set(uid, failure);
            setState((prev) => ({
              ...prev,
              loading: false,
              errors: [
                ...prev.errors.filter((item) => item.operation !== 'subscribeStudentProgress'),
                ...Array.from(progressFailures.values()),
              ],
            }));
            rebuildIfReady();
          },
          'useGuruDashboard',
          () => {
            if (!active || progressListeners.get(uid)?.token !== token) return;
            progressFailures.delete(uid);
            setState((prev) => ({
              ...prev,
              errors: [
                ...prev.errors.filter((failure) => failure.operation !== 'subscribeStudentProgress'),
                ...Array.from(progressFailures.values()),
              ],
            }));
          }
        );
        const listener = progressListeners.get(uid);
        if (listener?.token === token) listener.unsubscribe = unsubscribe;
        else unsubscribe();
      });

      rebuildIfReady();
    };

    const unsubStudents = subscribeStudents(
      (students) => {
        if (!active) return;
        const normalized = normalizeStudentDocuments(students);
        studentsRef.current = normalized;
        studentsReady = true;
        setState((prev) => ({
          ...prev,
          students: normalized,
          errors: prev.errors.filter((failure) => failure.operation !== 'subscribeStudents'),
        }));
        syncProgressListeners(normalized);
      },
      (failure) => {
        if (!active) return;
        studentsReady = true;
        setState((prev) => ({
          ...prev,
          loading: false,
          errors: [...prev.errors.filter((item) => item.operation !== failure.operation), failure],
        }));
      },
      (operation) => {
        if (!active) return;
        setState((prev) => ({ ...prev, errors: prev.errors.filter((failure) => failure.operation !== operation) }));
      }
    );

    const unsubComics = subscribeComics(
      (comics) => {
        if (!active) return;
        comicsRef.current = comics;
        comicsReady = true;
        setState((prev) => ({
          ...prev,
          comics,
          errors: prev.errors.filter((failure) => failure.operation !== 'subscribeComics'),
        }));
        rebuildIfReady();
      },
      (failure) => {
        if (!active) return;
        comicsReady = true;
        setState((prev) => ({
          ...prev,
          loading: false,
          errors: [...prev.errors.filter((item) => item.operation !== failure.operation), failure],
        }));
      },
      (operation) => {
        if (!active) return;
        setState((prev) => ({ ...prev, errors: prev.errors.filter((failure) => failure.operation !== operation) }));
      }
    );

    const unsubRecentActivities = subscribeRecentGuruActivities(
      (recentActivities) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          recentActivities,
          recentActivityLoading: false,
        }));
      },
      (failure) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          recentActivityLoading: false,
          errors: [...prev.errors.filter((item) => item.operation !== failure.operation), failure],
        }));
      },
      (operation) => {
        if (!active) return;
        setState((prev) => ({ ...prev, errors: prev.errors.filter((failure) => failure.operation !== operation) }));
      }
    );

    return () => {
      active = false;
      unsubStudents();
      unsubComics();
      unsubRecentActivities();
      progressListeners.forEach((listener) => listener.unsubscribe?.());
      progressListeners.clear();
    };
  }, [retryCount]);

  return { ...state, retry: () => setRetryCount((count) => count + 1) };
}
