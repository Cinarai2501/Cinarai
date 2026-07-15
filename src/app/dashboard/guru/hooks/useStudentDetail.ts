'use client';

import { useMemo } from 'react';
import { useStudentDetailSource } from './useStudentDetailSource';
import { buildAIUsage } from '@/app/dashboard/guru/view-model/teacher/student-detail/buildAIUsage';
import { buildProgress } from '@/app/dashboard/guru/view-model/teacher/student-detail/buildProgress';
import { buildReflection } from '@/app/dashboard/guru/view-model/teacher/student-detail/buildReflection';
import { buildStudentSummary } from '@/app/dashboard/guru/view-model/teacher/student-detail/buildStudentSummary';
import { buildTimeline } from '@/app/dashboard/guru/view-model/teacher/student-detail/buildTimeline';

export function useStudentDetail(studentId?: string) {
  const { profile, progressDocuments, reflections, activities, applicationActivities, loading, error } = useStudentDetailSource(studentId);

  const timelineItems = useMemo(() => buildTimeline(activities), [activities]);

  const studentSummary = useMemo(() => buildStudentSummary(profile, activities), [profile, activities]);

  const progressSummary = useMemo(() => buildProgress(progressDocuments), [progressDocuments]);

  const reflectionSummary = useMemo(() => buildReflection(reflections), [reflections]);

  const aiUsageSummary = useMemo(() => buildAIUsage(applicationActivities), [applicationActivities]);

  const stageScores = useMemo(
    () => progressSummary.stageProgress.map((stage) => ({ stage: stage.stage, score: stage.percentage })),
    [progressSummary.stageProgress]
  );

  return {
    profile,
    progressDocuments,
    reflections,
    activities,
    applicationActivities,
    studentSummary,
    progressSummary,
    timelineItems,
    reflectionSummary,
    aiUsageSummary,
    stageScores,
    loading,
    error,
  };
}
