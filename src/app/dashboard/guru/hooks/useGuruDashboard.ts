'use client';

import { useEffect, useRef, useState } from 'react';
import { subscribeStudents, subscribeComics, fetchAllStudentProgress } from '../services/firestoreService';
import { normalizeStudentDocuments } from '../services/studentNormalization';
import { buildStudentRow, buildDashboardSummary } from '../services/studentUtils';
import type { ComicDocument, UserDocument } from '@/types/firestore';
import type { DashboardSummary, StudentRow } from '../types';

interface GuruDashboardState {
  students: UserDocument[];
  comics: ComicDocument[];
  rows: StudentRow[];
  summary: DashboardSummary;
  loading: boolean;
  error: string | null;
}

const EMPTY_SUMMARY: DashboardSummary = {
  totalStudents: 0,
  totalComics: 0,
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
    loading: true,
    error: null,
  });

  const studentsRef = useRef<UserDocument[]>([]);
  const comicsRef = useRef<ComicDocument[]>([]);
  const progressFetchedRef = useRef(false);

  const rebuildRows = (students: UserDocument[], comics: ComicDocument[], progressMap: Map<string, import('@/types/firestore').ComicProgressDocument[]>) => {
    const rows = students.map((s) => buildStudentRow(s, progressMap.get(s.uid) ?? []));
    const summary = buildDashboardSummary(rows, comics.length);
    setState((prev) => ({ ...prev, rows, summary, loading: false }));
  };

  useEffect(() => {
    let active = true;
    const progressMap = new Map<string, import('@/types/firestore').ComicProgressDocument[]>();
    let studentsReady = false;
    let comicsReady = false;

    const tryFetchProgress = async () => {
      if (!studentsReady || !comicsReady || progressFetchedRef.current) return;
      progressFetchedRef.current = true;
      try {
        const all = await fetchAllStudentProgress(studentsRef.current.map((s) => s.uid));
        if (!active) return;
        all.forEach((p) => {
          const uid = p.userId ?? '';
          if (!uid) return;
          const arr = progressMap.get(uid) ?? [];
          arr.push(p);
          progressMap.set(uid, arr);
        });
        rebuildRows(studentsRef.current, comicsRef.current, progressMap);
      } catch (err) {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Gagal memuat progress',
        }));
      }
    };

    const unsubStudents = subscribeStudents(
      (students) => {
        if (!active) return;
        const normalized = normalizeStudentDocuments(students);
        studentsRef.current = normalized;
        studentsReady = true;
        setState((prev) => ({ ...prev, students: normalized }));
        progressFetchedRef.current = false;
        void tryFetchProgress();
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
        void tryFetchProgress();
      },
      (err) => {
        if (!active) return;
        setState((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    );

    return () => {
      active = false;
      unsubStudents();
      unsubComics();
    };
  }, []);

  return state;
}
