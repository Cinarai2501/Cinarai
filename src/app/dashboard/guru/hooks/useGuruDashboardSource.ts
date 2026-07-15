import { useEffect, useMemo, useRef, useState } from 'react';
import { GuruFirestoreInspector } from '@/app/dashboard/guru/services/guru/debug/GuruFirestoreInspector';
import type {
  ActivityDocument,
  ComicDocument,
  ComicProgressDocument,
  ReflectionDocument,
  UserDocument,
} from '@/types/firestore';
import {
  loadAllComics,
  loadAllProgressDocuments,
  loadAllReflections,
  loadAllUsers,
  loadRecentActivities,
} from '@/app/dashboard/guru/services/guru/dashboard/guruDashboardFirestore';

export type GuruDashboardSourceState = {
  students: UserDocument[];
  comics: ComicDocument[];
  progressDocuments: ComicProgressDocument[];
  progressByStudent: Map<string, ComicProgressDocument[]>;
  activities: ActivityDocument[];
  reflections: ReflectionDocument[];
  // Overall loading/error reflect users status (users are required to render)
  loading: boolean;
  error: string | null;
  // Per-source statuses
  usersLoading: boolean;
  usersError: string | null;
  usersSuccess: boolean;
  comicsLoading: boolean;
  comicsError: string | null;
  comicsSuccess: boolean;
  progressLoading: boolean;
  progressError: string | null;
  progressSuccess: boolean;
  activitiesLoading: boolean;
  activitiesError: string | null;
  activitiesSuccess: boolean;
  reflectionsLoading: boolean;
  reflectionsError: string | null;
  reflectionsSuccess: boolean;
};

const initialSourceState: GuruDashboardSourceState = {
  students: [],
  comics: [],
  progressDocuments: [],
  progressByStudent: new Map(),
  activities: [],
  reflections: [],
  loading: true,
  error: null,
  usersLoading: true,
  usersError: null,
  usersSuccess: false,
  comicsLoading: true,
  comicsError: null,
  comicsSuccess: false,
  progressLoading: true,
  progressError: null,
  progressSuccess: false,
  activitiesLoading: true,
  activitiesError: null,
  activitiesSuccess: false,
  reflectionsLoading: true,
  reflectionsError: null,
  reflectionsSuccess: false,
};

export function useGuruDashboardSource(): GuruDashboardSourceState & { debugEntries: ReturnType<typeof GuruFirestoreInspector.getEntries> } {
  const [state, setState] = useState(initialSourceState);
  const [debugEntries, setDebugEntries] = useState(() => GuruFirestoreInspector.getEntries());
  const loaded = useRef({ users: false, comics: false, progress: false, activities: false, reflections: false });

  useEffect(() => {
    let active = true;

    const markLoaded = (key: keyof typeof loaded.current) => {
      if (!active) return;
      if (!loaded.current[key]) {
        loaded.current[key] = true;
      }

      // Top-level loading follows usersLoading: when users finished loading, loading=false
      if (loaded.current.users) {
        setState((current) => ({ ...current, loading: false }));
      }
    };

    const handleSourceError = (key: keyof typeof loaded.current, error: Error, sourceName: string) => {
      if (!active) return;
      console.warn(`[GuruDashboard] ${sourceName} failed`, {
        errorCode: (error as { code?: string }).code ?? 'unknown',
        errorMessage: error.message,
      });
      markLoaded(key);
    };

    const unsubscribeInspector = GuruFirestoreInspector.subscribe((entries) => {
      setDebugEntries(entries);
    });

    void (async () => {
      const [usersResult, comicsResult, progressResult, activitiesResult, reflectionsResult] = await Promise.allSettled([
        loadAllUsers(),
        loadAllComics(),
        loadAllProgressDocuments(),
        loadRecentActivities(20),
        loadAllReflections(),
      ]);

      if (!active) return;

      if (usersResult.status === 'fulfilled') {
        setState((current) => ({
          ...current,
          students: usersResult.value.filter((user) => user.role === 'student'),
          usersLoading: false,
          usersError: null,
          usersSuccess: true,
        }));
        markLoaded('users');
      } else {
        const err = usersResult.reason as Error;
        setState((current) => ({
          ...current,
          usersLoading: false,
          usersError: err.message,
          usersSuccess: false,
        }));
        handleSourceError('users', usersResult.reason as Error, 'users');
      }

      if (comicsResult.status === 'fulfilled') {
        setState((current) => ({ ...current, comics: comicsResult.value, comicsLoading: false, comicsError: null, comicsSuccess: true }));
        markLoaded('comics');
      } else {
        const err = comicsResult.reason as Error;
        setState((current) => ({ ...current, comicsLoading: false, comicsError: err.message, comicsSuccess: false }));
        handleSourceError('comics', comicsResult.reason as Error, 'comics');
      }

      if (progressResult.status === 'fulfilled') {
        setState((current) => ({ ...current, progressDocuments: progressResult.value, progressLoading: false, progressError: null, progressSuccess: true }));
        markLoaded('progress');
      } else {
        const err = progressResult.reason as Error;
        setState((current) => ({ ...current, progressLoading: false, progressError: err.message, progressSuccess: false }));
        handleSourceError('progress', progressResult.reason as Error, 'progress');
      }

      if (activitiesResult.status === 'fulfilled') {
        setState((current) => ({ ...current, activities: activitiesResult.value, activitiesLoading: false, activitiesError: null, activitiesSuccess: true }));
        markLoaded('activities');
      } else {
        const err = activitiesResult.reason as Error;
        setState((current) => ({ ...current, activitiesLoading: false, activitiesError: err.message, activitiesSuccess: false }));
        handleSourceError('activities', activitiesResult.reason as Error, 'activities');
      }

      if (reflectionsResult.status === 'fulfilled') {
        setState((current) => ({ ...current, reflections: reflectionsResult.value, reflectionsLoading: false, reflectionsError: null, reflectionsSuccess: true }));
        markLoaded('reflections');
      } else {
        const err = reflectionsResult.reason as Error;
        setState((current) => ({ ...current, reflectionsLoading: false, reflectionsError: err.message, reflectionsSuccess: false }));
        handleSourceError('reflections', reflectionsResult.reason as Error, 'reflections');
      }
    })();

    return () => {
      active = false;
      unsubscribeInspector();
    };
  }, []);

  const progressByStudent = useMemo(() => {
    const map = new Map<string, ComicProgressDocument[]>();
    state.progressDocuments.forEach((document) => {
      const userId = (document as unknown as { userId?: string }).userId ?? '';
      if (!userId) return;
      const existing = map.get(userId) ?? [];
      existing.push(document);
      map.set(userId, existing);
    });
    return map;
  }, [state.progressDocuments]);

  return {
    ...state,
    progressByStudent,
    debugEntries: process.env.NODE_ENV === 'development' ? debugEntries : [],
  };
}
