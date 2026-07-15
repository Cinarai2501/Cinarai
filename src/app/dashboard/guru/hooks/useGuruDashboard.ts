import { useMemo } from 'react';
import { useGuruDashboardSource } from './useGuruDashboardSource';

export function useGuruDashboard() {
  const {
    loading,
    error,
    usersLoading,
    usersError,
    comicsLoading,
    comicsError,
    progressLoading,
    progressError,
    activitiesLoading,
    activitiesError,
    reflectionsLoading,
    reflectionsError,
    dashboardSnapshot,
  } = useGuruDashboardSource();

  const summary = useMemo(() => dashboardSnapshot.summary, [dashboardSnapshot.summary]);
  const progressItems = useMemo(() => dashboardSnapshot.progressItems, [dashboardSnapshot.progressItems]);
  const modules = useMemo(() => dashboardSnapshot.modules, [dashboardSnapshot.modules]);
  const recentActivities = useMemo(() => dashboardSnapshot.recentActivities, [dashboardSnapshot.recentActivities]);

  return {
    summary,
    progressItems,
    modules,
    recentActivities,
    loading,
    error,
    usersLoading,
    usersError,
    comicsLoading,
    comicsError,
    progressLoading,
    progressError,
    activitiesLoading,
    activitiesError,
    reflectionsLoading,
    reflectionsError,
  };
}
