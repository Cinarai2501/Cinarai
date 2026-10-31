'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentUser } from '@/lib/firebase/auth';
import { readJsonResponse } from '@/lib/api/readJsonResponse';
import { normalizeComicProgressDocuments, normalizeStudentDocuments } from '../services/studentNormalization';
import { buildStudentRow, buildDashboardSummary } from '../services/studentUtils';
import { deduplicateActivitiesById } from '../services/activityUtils';
import type {
  ActivityDocument,
  ComicDocument,
  ComicProgressDocument,
  ReflectionDocument,
  UserDocument,
} from '@/types/firestore';
import type { DashboardSummary, StudentRow } from '../types';
import type { GuruRecentActivity } from '../services/firestoreService';

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

function createInitialState(): GuruDashboardState {
  return {
    students: [],
    comics: [],
    rows: [],
    summary: EMPTY_SUMMARY,
    recentActivities: [],
    recentActivityLoading: true,
    loading: true,
    error: null,
  };
}

interface DashboardResponse {
  success?: boolean;
  error?: string;
  students?: UserDocument[];
  comics?: ComicDocument[];
  progressDocuments?: ComicProgressDocument[];
  activities?: ActivityDocument[];
  reflections?: ReflectionDocument[];
  applicationActivities?: Array<{
    id: string;
    userId: string;
    comicId?: number;
    selectedAnswer?: string;
    studentReason?: string;
    coachType?: string;
    timestamp?: unknown;
    localTimestamp?: string;
  }>;
  identificationAnswers?: Array<{
    id: string;
    userId: string;
    comicId?: number;
    step?: number;
    selectedAnswer?: string | null;
    reason?: string;
    updatedAt?: unknown;
    createdAt?: unknown;
  }>;
  errors?: Record<string, string | undefined>;
}

const EMPTY_SUMMARY: DashboardSummary = {
  totalStudents: 0,
  totalComics: 0,
  activeStudents: 0,
  learningStudents: 0,
  attentionStudents: 0,
  notStartedStudents: 0,
  studentsCompleted: 0,
  progressDocuments: 0,
  totalCompleted: 0,
  completionRate: 0,
  averageProgress: 0,
};

function timestampMillis(value: unknown): number | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value).getTime();
    return Number.isFinite(date) ? date : null;
  }
  if (value && typeof value === 'object' && 'toDate' in value
    && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date.getTime() : null;
  }
  return null;
}

function buildRecentActivities(
  activities: ActivityDocument[],
  reflections: ReflectionDocument[],
  applications: NonNullable<DashboardResponse['applicationActivities']>,
  identificationAnswers: NonNullable<DashboardResponse['identificationAnswers']>,
  studentUids: Set<string>,
): GuruRecentActivity[] {
  const activityRows = activities.flatMap((activity) => {
    if (!activity.id || !activity.userId || !studentUids.has(activity.userId)) return [];
    return [{
      id: `activity:${activity.id}`,
      userId: activity.userId,
      title: activity.title?.trim() || activity.type || 'Aktivitas belajar',
      description: activity.description,
      timestamp: activity.occurredAt,
    }];
  });
  const reflectionRows = reflections.flatMap((reflection) => {
    const userId = reflection.userId || reflection.studentId;
    if (!reflection.id || !userId || !studentUids.has(userId)) return [];
    return [{
      id: `reflection:${reflection.id}`,
      userId,
      title: `Refleksi Komik ${reflection.comicId ?? reflection.moduleId ?? '—'}`,
      description: reflection.reflectionText || reflection.response,
      timestamp: reflection.submittedAt ?? reflection.createdAt ?? reflection.timestamp,
    }];
  });
  const applicationRows = applications.flatMap((application) => {
    if (!application.id || !application.userId || !studentUids.has(application.userId)) return [];
    return [{
      id: `application:${application.id}`,
      userId: application.userId,
      title: `Penerapan Komik ${application.comicId ?? '—'}`,
      description: [application.selectedAnswer, application.studentReason].filter(Boolean).join(' · ') || undefined,
      timestamp: application.timestamp ?? application.localTimestamp,
    }];
  });
  const identificationRows = identificationAnswers.flatMap((answer) => {
    if (!answer.id || !answer.userId || !studentUids.has(answer.userId)) return [];
    return [{
      id: `identification:${answer.id}`,
      userId: answer.userId,
      title: `Identifikasi Komik ${answer.comicId ?? '—'} · Langkah ${answer.step === undefined ? '—' : answer.step + 1}`,
      description: [answer.selectedAnswer, answer.reason].filter(Boolean).join(' · ') || undefined,
      timestamp: answer.updatedAt ?? answer.createdAt,
    }];
  });

  return deduplicateActivitiesById([
    ...activityRows,
    ...reflectionRows,
    ...applicationRows,
    ...identificationRows,
  ])
    .filter((activity) => timestampMillis(activity.timestamp) !== null)
    .sort((left, right) => (timestampMillis(right.timestamp) ?? 0) - (timestampMillis(left.timestamp) ?? 0))
    .slice(0, 20);
}

export function useGuruDashboard() {
  const { user, loading: authLoading } = useAuth();
  const userUid = user?.uid;
  const userRole = user?.role;
  const [state, setState] = useState<GuruDashboardState>(createInitialState);

  useEffect(() => {
    if (authLoading) {
      setState(createInitialState());
      return;
    }
    if (!userUid || (userRole !== 'teacher' && userRole !== 'admin')) {
      setState({
        ...createInitialState(),
        loading: false,
        recentActivityLoading: false,
        error: 'Sesi guru tidak valid. Silakan masuk kembali.',
      });
      return;
    }

    let active = true;
    const controller = new AbortController();
    setState(createInitialState());

    const loadDashboard = async () => {
      try {
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) throw new Error('Sesi guru tidak valid. Silakan masuk kembali.');
        const token = await firebaseUser.getIdToken();
        const endpoint = '/api/dashboard/guru';
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          cache: 'no-store',
        });
        const payload = await readJsonResponse<DashboardResponse>(response, endpoint);
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Data dashboard guru gagal dimuat.');
        }

        const students = normalizeStudentDocuments(payload.students ?? []);
        const comics = payload.comics ?? [];
        const progressByUid = new Map<string, ComicProgressDocument[]>();
        (payload.progressDocuments ?? []).forEach((progress) => {
          const uid = progress.userId?.trim();
          if (!uid) return;
          const documents = progressByUid.get(uid) ?? [];
          documents.push({
            ...progress,
            id: progress.id ?? `comic-${progress.comicId}`,
          });
          progressByUid.set(uid, documents);
        });
        const rows = students.map((student) => buildStudentRow(
          student,
          normalizeComicProgressDocuments(
            student.uid,
            (progressByUid.get(student.uid) ?? []).map((progress) => ({
              ...progress,
              id: progress.id ?? `comic-${progress.comicId}`,
            }))
          )
        ));
        const summary = buildDashboardSummary(rows, comics.length);
        const studentUids = new Set(students.map((student) => student.uid));
        const recentActivities = buildRecentActivities(
          payload.activities ?? [],
          payload.reflections ?? [],
          payload.applicationActivities ?? [],
          payload.identificationAnswers ?? [],
          studentUids
        );
        const partialErrors = Object.values(payload.errors ?? {}).filter(
          (message): message is string => Boolean(message)
        );

        if (active) {
          setState({
            students,
            comics,
            rows,
            summary,
            recentActivities,
            recentActivityLoading: false,
            loading: false,
            error: partialErrors.length ? partialErrors.join(' ') : null,
          });
        }
      } catch (error) {
        if (!active || (error instanceof Error && error.name === 'AbortError')) return;
        setState((previous) => ({
          ...previous,
          loading: false,
          recentActivityLoading: false,
          error: error instanceof Error ? error.message : 'Data dashboard guru gagal dimuat.',
        }));
      }
    };

    void loadDashboard();
    return () => {
      active = false;
      controller.abort();
    };
  }, [authLoading, userRole, userUid]);

  return state;
}
