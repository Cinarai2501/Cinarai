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
  error: string | null;
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
    error: null,
  });

  const studentsRef = useRef<UserDocument[]>([]);
  const comicsRef = useRef<ComicDocument[]>([]);

  const rebuildRows = (students: UserDocument[], comics: ComicDocument[], progressMap: Map<string, import('@/types/firestore').ComicProgressDocument[]>) => {
    const rows = students.map((s) => buildStudentRow(s, progressMap.get(s.uid) ?? []));
    const summary = buildDashboardSummary(rows, comics.length);
    setState((prev) => ({ ...prev, rows, summary, loading: false }));
  };

  useEffect(() => {
    let active = true;
    const progressMap = new Map<string, import('@/types/firestore').ComicProgressDocument[]>();
    const progressListeners = new Map<string, { token: object; unsubscribe: (() => void) | null }>();
    const progressReady = new Set<string>();
    let studentsReady = false;
    let comicsReady = false;

    const rebuildIfReady = () => {
      const allProgressReady = studentsRef.current.every((student) => progressReady.has(student.uid));
      if (studentsReady && comicsReady && allProgressReady) {
        rebuildRows(studentsRef.current, comicsRef.current, progressMap);
      }
    };

    const syncProgressListeners = (students: UserDocument[]) => {
      const studentUids = new Set(students.map((student) => student.uid).filter(Boolean));

      progressListeners.forEach((listener, uid) => {
        if (studentUids.has(uid)) return;
        listener.unsubscribe?.();
        progressListeners.delete(uid);
        progressReady.delete(uid);
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
            rebuildIfReady();
          },
          (err) => {
            if (!active || progressListeners.get(uid)?.token !== token) return;
            progressReady.add(uid);
            setState((prev) => ({ ...prev, loading: false, error: err.message }));
            rebuildIfReady();
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
        setState((prev) => ({ ...prev, students: normalized }));
        syncProgressListeners(normalized);
      },
      (err) => {
        if (!active) return;
        setState((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    );

    const unsubComics = subscribeComics(
      (comics) => {
        if (!active) return;
        comicsRef.current = comics;
        comicsReady = true;
        setState((prev) => ({ ...prev, comics }));
        rebuildIfReady();
      },
      (err) => {
        if (!active) return;
        setState((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    );

    const unsubRecentActivities = subscribeRecentGuruActivities(
      (recentActivities) => {
        if (!active) return;
        setState((prev) => ({ ...prev, recentActivities, recentActivityLoading: false }));
      },
      (err) => {
        if (!active) return;
        setState((prev) => ({ ...prev, recentActivityLoading: false, error: err.message }));
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
  }, []);

  return state;
}
