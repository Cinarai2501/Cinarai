'use client';

import { useMemo } from 'react';
import { useStudentDetailSource } from './useStudentDetailSource';
import { SINTAKS } from '@/types/progress';
import { toDateValue } from '@/app/teacher/studentDetail.utils';

export function useStudentDetail(studentId?: string) {
  const { profile, progressDocuments, reflections, activities, applicationActivities, loading, error } = useStudentDetailSource(studentId);

  const progressByStage = useMemo(() => {
    return SINTAKS.map((stage) => {
      const completed = progressDocuments.filter((document) => {
        return (document.sintaksList ?? []).some((item) => item.sintaks === stage && item.status === 'COMPLETED');
      }).length;

      const total = progressDocuments.length || 1;
      return {
        stage,
        status: completed === 0 ? 'Belum Dimulai' : completed === total ? 'Selesai' : 'Sedang Berjalan',
        percentage: Math.round((completed / total) * 100),
        completedCount: completed,
        totalCount: total,
      };
    });
  }, [progressDocuments]);

  const overallProgress = useMemo(() => {
    if (!progressDocuments.length) return 0;
    const totalPercentage = progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0);
    return Math.round(totalPercentage / progressDocuments.length);
  }, [progressDocuments]);

  const averageScore = useMemo(() => {
    if (!progressDocuments.length) return 0;
    return Math.round(
      progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / progressDocuments.length
    );
  }, [progressDocuments]);

  const completedModules = useMemo(
    () => progressDocuments.filter((document) => document.status === 'completed' || (document.percentage ?? 0) >= 100).length,
    [progressDocuments]
  );

  const learningDuration = useMemo(() => {
    const dates = progressDocuments
      .map((document) => toDateValue(document.completedAt))
      .filter((date): date is Date => date instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime());

    if (!dates.length) return 'Belum tersedia';
    const first = dates[0].getTime();
    const last = dates[dates.length - 1].getTime();
    const diffHours = Math.max(1, Math.round((last - first) / (1000 * 60 * 60)));
    return `${diffHours} jam`;
  }, [progressDocuments]);

  const timeline = useMemo(() => {
    return activities
      .map((activity) => ({
        ...activity,
        title: activity.title || activity.type,
        occurredAt: toDateValue(activity.occurredAt) ?? new Date(),
      }))
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }, [activities]);

  const reflectionSummary = useMemo(() => {
    if (!reflections.length) return null;
    const latest = reflections[reflections.length - 1];
    return {
      text: latest.reflectionText ?? '',
      rating: latest.rating ?? null,
      aiReflection: typeof latest.aiReflection === 'object' ? latest.aiReflection : null,
      stage: latest.stage ?? 'Introspection',
      submittedAt: toDateValue(latest.submittedAt),
    };
  }, [reflections]);

  const aiTutorSummary = useMemo(() => {
    const uses = applicationActivities.length;
    const last = applicationActivities[0];
    return {
      uses,
      lastQuestion: last?.coachMessage ?? null,
      lastUsedAt: toDateValue(last?.timestamp),
    };
  }, [applicationActivities]);

  const stageScores = useMemo(() => {
    return SINTAKS.map((stage) => {
      const stageValues = progressDocuments.flatMap((document) =>
        (document.sintaksList ?? [])
          .filter((item) => item.sintaks === stage && item.status === 'COMPLETED')
          .map(() => document.percentage ?? 0)
      );
      return {
        stage,
        score: stageValues.length ? Math.round(stageValues.reduce((sum, value) => sum + value, 0) / stageValues.length) : 0,
      };
    });
  }, [progressDocuments]);

  return {
    profile,
    progressDocuments,
    reflections,
    activities,
    applicationActivities,
    progressByStage,
    overallProgress,
    averageScore,
    completedModules,
    learningDuration,
    timeline,
    reflectionSummary,
    aiTutorSummary,
    stageScores,
    loading,
    error,
  };
}
