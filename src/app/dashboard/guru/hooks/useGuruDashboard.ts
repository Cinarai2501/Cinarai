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
    if (!students.length) return null;
    return buildGuruDashboardSummary(students, comics, progressByStudent);
  }, [students, comics, progressByStudent]);

  const progressItems = useMemo(() => {
    if (!students.length) return [];
    return buildGuruProgressOverview(students, progressByStudent);
  }, [students, comics, progressByStudent]);

  const modules = useMemo(() => {
    if (!comics.length) return [];
    return buildGuruModuleSummaries(comics, progressByStudent);
  }, [comics, progressByStudent]);

  const recentActivities = useMemo(() => {
    if (!activities.length) return [];
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
