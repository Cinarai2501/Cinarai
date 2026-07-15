import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildGuruDashboardSnapshot } from '@/app/dashboard/guru/services/guru/dashboard/dashboardModel';
import { fetchGuruDashboardFromApi } from '@/app/dashboard/guru/services/guru/dashboard/dashboardApi';
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
        }));
        return;
      }

      try {
        const data = await fetchGuruDashboardFromApi();
        if (!active) return;
        setState((current) => ({
          ...current,
          students: data.students,
          comics: data.comics,
          progressDocuments: data.progressDocuments,
          activities: data.activities,
          reflections: data.reflections,
          loading: false,
          error: null,
          usersLoading: false,
          usersError: null,
          usersSuccess: true,
          comicsLoading: false,
          comicsError: null,
          comicsSuccess: true,
          progressLoading: false,
          progressError: null,
          progressSuccess: true,
          activitiesLoading: false,
          activitiesError: null,
          activitiesSuccess: true,
          reflectionsLoading: false,
          reflectionsError: null,
          reflectionsSuccess: true,
        }));
      } catch (error) {
        if (!active) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error instanceof Error ? error.message : 'Dashboard guru gagal dimuat',
          usersLoading: false,
          usersError: error instanceof Error ? error.message : 'Failed to load users',
          usersSuccess: false,
          comicsLoading: false,
          comicsError: error instanceof Error ? error.message : 'Failed to load comics',
          comicsSuccess: false,
          progressLoading: false,
          progressError: error instanceof Error ? error.message : 'Failed to load progress',
          progressSuccess: false,
          activitiesLoading: false,
          activitiesError: error instanceof Error ? error.message : 'Failed to load activities',
          activitiesSuccess: false,
          reflectionsLoading: false,
          reflectionsError: error instanceof Error ? error.message : 'Failed to load reflections',
          reflectionsSuccess: false,
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
