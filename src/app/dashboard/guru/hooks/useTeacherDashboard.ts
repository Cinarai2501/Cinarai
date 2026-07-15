import { useMemo } from 'react';
import { useTeacherDashboardSource } from './useTeacherDashboardSource';
import { buildTeacherDashboardSummary } from '../services/teacher/dashboard/stats';
import { buildTeacherModuleSummaries } from '../services/teacher/dashboard/module';
import { buildTeacherProgressOverview } from '../services/teacher/dashboard/progress';
import { buildTeacherRecentActivities } from '../services/teacher/dashboard/activity';

export function useTeacherDashboard() {
  const {
    students,
    comics,
    progressByStudent,
    activities,
    loading,
    error,
  } = useTeacherDashboardSource();

  const summary = useMemo(() => {
    if (!students.length || !comics.length) return null;
    return buildTeacherDashboardSummary(students, comics, progressByStudent);
  }, [students, comics, progressByStudent]);

  const progressItems = useMemo(() => {
    if (!students.length || !comics.length) return [];
    return buildTeacherProgressOverview(students, progressByStudent);
  }, [students, comics, progressByStudent]);

  const modules = useMemo(() => {
    if (!comics.length) return [];
    return buildTeacherModuleSummaries(comics, progressByStudent);
  }, [comics, progressByStudent]);

  const recentActivities = useMemo(() => {
    if (!activities.length) return [];
    return buildTeacherRecentActivities(activities, students);
  }, [activities, students]);

  return {
    summary,
    progressItems,
    modules,
    recentActivities,
    loading,
    error,
  };
}
