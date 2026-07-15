import { useMemo } from 'react';
import { useGuruDashboardSource } from './useGuruDashboardSource';
import { buildGuruDashboardSummary } from '../services/guru/dashboard/stats';
import { buildGuruModuleSummaries } from '../services/guru/dashboard/module';
import { buildGuruProgressOverview } from '../services/guru/dashboard/progress';
import { buildGuruRecentActivities } from '../services/guru/dashboard/activity';

export function useGuruDashboard() {
  const {
    students,
    comics,
    progressByStudent,
    activities,
    loading,
    error,
    debugEntries,
  } = useGuruDashboardSource();

  const summary = useMemo(() => {
    return buildGuruDashboardSummary(students, comics, progressByStudent);
  }, [students, comics, progressByStudent]);

  const progressItems = useMemo(() => {
    return buildGuruProgressOverview(students, progressByStudent);
  }, [students, progressByStudent]);

  const modules = useMemo(() => {
    return buildGuruModuleSummaries(comics, progressByStudent);
  }, [comics, progressByStudent]);

  const recentActivities = useMemo(() => {
    return buildGuruRecentActivities(activities, students);
  }, [activities, students]);

  return {
    summary,
    progressItems,
    modules,
    recentActivities,
    loading,
    error,
    debugEntries,
  };
}
