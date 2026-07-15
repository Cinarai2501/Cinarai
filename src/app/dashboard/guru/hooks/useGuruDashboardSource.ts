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
  loading: boolean;
  error: string | null;
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

      if (Object.values(loaded.current).every(Boolean)) {
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
        }));
        markLoaded('users');
      } else {
        handleSourceError('users', usersResult.reason as Error, 'users');
      }

      if (comicsResult.status === 'fulfilled') {
        setState((current) => ({ ...current, comics: comicsResult.value }));
        markLoaded('comics');
      } else {
        handleSourceError('comics', comicsResult.reason as Error, 'comics');
      }

      if (progressResult.status === 'fulfilled') {
        setState((current) => ({ ...current, progressDocuments: progressResult.value }));
        markLoaded('progress');
      } else {
        handleSourceError('progress', progressResult.reason as Error, 'progress');
      }

      if (activitiesResult.status === 'fulfilled') {
        setState((current) => ({ ...current, activities: activitiesResult.value }));
        markLoaded('activities');
      } else {
        handleSourceError('activities', activitiesResult.reason as Error, 'activities');
      }

      if (reflectionsResult.status === 'fulfilled') {
        setState((current) => ({ ...current, reflections: reflectionsResult.value }));
        markLoaded('reflections');
      } else {
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
