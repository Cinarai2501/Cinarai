import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ActivityDocument,
  ComicDocument,
  ComicProgressDocument,
  ReflectionDocument,
  UserDocument,
} from '@/types/firestore';
import {
  subscribeToAllProgressDocuments,
  subscribeToComics,
  subscribeToRecentActivities,
  subscribeToReflections,
  subscribeToUsers,
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

export function useGuruDashboardSource(): GuruDashboardSourceState {
  const [state, setState] = useState(initialSourceState);
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

    const usersUnsubscribe = subscribeToUsers(
      (users) => {
        if (!active) return;
        setState((current) => ({ ...current, students: users.filter((user) => user.role === 'student') }));
        markLoaded('users');
      },
      (error) => {
        if (!active) return;
        handleSourceError('users', error, 'users');
      }
    );

    const comicsUnsubscribe = subscribeToComics(
      (comics) => {
        if (!active) return;
        setState((current) => ({ ...current, comics }));
        markLoaded('comics');
      },
      (error) => {
        if (!active) return;
        handleSourceError('comics', error, 'comics');
      }
    );

    const progressUnsubscribe = subscribeToAllProgressDocuments(
      (progressDocuments) => {
        if (!active) return;
        setState((current) => ({ ...current, progressDocuments }));
        markLoaded('progress');
      },
      (error) => {
        if (!active) return;
        handleSourceError('progress', error, 'progress');
      }
    );

    const activitiesUnsubscribe = subscribeToRecentActivities(
      (activities) => {
        if (!active) return;
        setState((current) => ({ ...current, activities }));
        markLoaded('activities');
      },
      (error) => {
        if (!active) return;
        handleSourceError('activities', error, 'activities');
      }
    );

    const reflectionsUnsubscribe = subscribeToReflections(
      (reflections) => {
        if (!active) return;
        setState((current) => ({ ...current, reflections }));
        markLoaded('reflections');
      },
      (error) => {
        if (!active) return;
        handleSourceError('reflections', error, 'reflections');
      }
    );

    return () => {
      active = false;
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
  };
}
