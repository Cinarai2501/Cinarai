import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildGuruDashboardSnapshot } from '@/app/dashboard/guru/services/guru/dashboard/dashboardModel';
import { fetchGuruDashboardFromApi, type GuruDashboardApiResponse } from '@/app/dashboard/guru/services/guru/dashboard/dashboardApi';
import type {
  ActivityDocument,
  ComicDocument,
  ComicProgressDocument,
  ReflectionDocument,
  UserDocument,
} from '@/types/firestore';

export type GuruDashboardSourceState = {
  students: UserDocument[];
  comics: ComicDocument[];
  progressDocuments: ComicProgressDocument[];
  progressByStudent: Map<string, ComicProgressDocument[]>;
  activities: ActivityDocument[];
  reflections: ReflectionDocument[];
  loading: boolean;
  error: string | null;
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

export function useGuruDashboardSource() {
  const [state, setState] = useState(initialSourceState);
  const { user } = useAuth();

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      if (!active) return;

      if (!user || user.role !== 'teacher') {
        if (!active) return;
        setState((current) => ({
          ...current,
          loading: false,
          usersLoading: false,
          comicsLoading: false,
          progressLoading: false,
          activitiesLoading: false,
          reflectionsLoading: false,
          usersSuccess: false,
          comicsSuccess: false,
          progressSuccess: false,
          activitiesSuccess: false,
          reflectionsSuccess: false,
          error: user ? 'Akun ini bukan akun guru.' : 'Sesi tidak tersedia',
          students: [],
          comics: [],
          progressDocuments: [],
          activities: [],
          reflections: [],
        }));
        return;
      }

      try {
        const data: GuruDashboardApiResponse = await fetchGuruDashboardFromApi();
        if (!active) return;
        const apiErrors = data.errors ?? {};
        const usersError: string | null = apiErrors.users ?? null;
        const comicsError: string | null = apiErrors.comics ?? null;
        const progressError: string | null = apiErrors.progress ?? null;
        const activitiesError: string | null = apiErrors.activity ?? null;
        const reflectionsError: string | null = apiErrors.reflection ?? null;

        const hasPartialErrors = Boolean(usersError || comicsError || progressError || activitiesError || reflectionsError || data.error);

        setState((current) => ({
          ...current,
          students: data.students ?? [],
          comics: data.comics ?? [],
          progressDocuments: data.progressDocuments ?? [],
          activities: data.activities ?? [],
          reflections: data.reflections ?? [],
          loading: false,
          error: data.error ?? (hasPartialErrors ? 'Sebagian data tidak tersedia' : null),
          usersLoading: false,
          usersError: usersError,
          usersSuccess: !usersError,
          comicsLoading: false,
          comicsError: comicsError,
          comicsSuccess: !comicsError,
          progressLoading: false,
          progressError: progressError,
          progressSuccess: !progressError,
          activitiesLoading: false,
          activitiesError: activitiesError,
          activitiesSuccess: !activitiesError,
          reflectionsLoading: false,
          reflectionsError: reflectionsError,
          reflectionsSuccess: !reflectionsError,
        }));
      } catch (error) {
        if (!active) return;
        const errorMessage = error instanceof Error ? error.message : 'Dashboard guru gagal dimuat';
        setState((current) => ({
          ...current,
          loading: false,
          error: errorMessage,
          usersLoading: false,
          usersError: errorMessage,
          usersSuccess: false,
          comicsLoading: false,
          comicsError: errorMessage,
          comicsSuccess: false,
          progressLoading: false,
          progressError: errorMessage,
          progressSuccess: false,
          activitiesLoading: false,
          activitiesError: errorMessage,
          activitiesSuccess: false,
          reflectionsLoading: false,
          reflectionsError: errorMessage,
          reflectionsSuccess: false,
          students: [],
          comics: [],
          progressDocuments: [],
          activities: [],
          reflections: [],
        }));
      }
    };

    void loadDashboard();
    const intervalId = window.setInterval(() => {
      void loadDashboard();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user]);

  const progressByStudent = useMemo(() => {
    const map = new Map<string, ComicProgressDocument[]>();
    state.progressDocuments.forEach((document) => {
      const userId = document.userId ?? '';
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
    dashboardSnapshot: buildGuruDashboardSnapshot({
      students: state.students,
      comics: state.comics,
      progressDocuments: state.progressDocuments,
      activities: state.activities,
      reflections: state.reflections,
    }),
  };
}
