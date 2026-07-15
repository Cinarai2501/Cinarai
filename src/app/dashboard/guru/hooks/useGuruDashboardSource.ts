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
  subscribeToUsers,
  subscribeToComics,
  subscribeToAllProgressDocuments,
  subscribeToRecentActivities,
  subscribeToReflections,
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
      setState((current) => ({
        ...current,
        ...(key === 'users' ? { error: `${sourceName} load failed: ${error.message}` } : {}),
      }));
      markLoaded(key);
    };

    const unsubscribeInspector = GuruFirestoreInspector.subscribe((entries) => {
      setDebugEntries(entries);
    });

    const usersUnsubscribe = subscribeToUsers(
      (users) => {
        if (!active) return;
        setState((current) => ({
          ...current,
          students: users.filter((user) => String(user.role ?? '').toLowerCase() === 'student'),
          usersLoading: false,
          usersError: null,
          usersSuccess: true,
        }));
        markLoaded('users');
      },
      (error) => {
        if (!active) return;
        setState((current) => ({
          ...current,
          usersLoading: false,
          usersError: error.message,
          usersSuccess: false,
        }));
        handleSourceError('users', error, 'users');
      }
    );

    const comicsUnsubscribe = subscribeToComics(
      (comics) => {
        if (!active) return;
        setState((current) => ({ ...current, comics, comicsLoading: false, comicsError: null, comicsSuccess: true }));
        markLoaded('comics');
      },
      (error) => {
        if (!active) return;
        setState((current) => ({ ...current, comicsLoading: false, comicsError: error.message, comicsSuccess: false }));
        handleSourceError('comics', error, 'comics');
      }
    );

    const progressUnsubscribe = subscribeToAllProgressDocuments(
      (progressDocuments) => {
        if (!active) return;
        setState((current) => ({ ...current, progressDocuments, progressLoading: false, progressError: null, progressSuccess: true }));
        markLoaded('progress');
      },
      (error) => {
        if (!active) return;
        setState((current) => ({ ...current, progressLoading: false, progressError: error.message, progressSuccess: false }));
        handleSourceError('progress', error, 'progress');
      }
    );

    const activitiesUnsubscribe = subscribeToRecentActivities(
      (activities) => {
        if (!active) return;
        setState((current) => ({ ...current, activities, activitiesLoading: false, activitiesError: null, activitiesSuccess: true }));
        markLoaded('activities');
      },
      (error) => {
        if (!active) return;
        setState((current) => ({ ...current, activitiesLoading: false, activitiesError: error.message, activitiesSuccess: false }));
        handleSourceError('activities', error, 'activities');
      }
    );

    const reflectionsUnsubscribe = subscribeToReflections(
      (reflections) => {
        if (!active) return;
        setState((current) => ({ ...current, reflections, reflectionsLoading: false, reflectionsError: null, reflectionsSuccess: true }));
        markLoaded('reflections');
      },
      (error) => {
        if (!active) return;
        setState((current) => ({ ...current, reflectionsLoading: false, reflectionsError: error.message, reflectionsSuccess: false }));
        handleSourceError('reflections', error, 'reflections');
      }
    );

    return () => {
      active = false;
      unsubscribeInspector();
      usersUnsubscribe();
      comicsUnsubscribe();
      progressUnsubscribe();
      activitiesUnsubscribe();
      reflectionsUnsubscribe();
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
