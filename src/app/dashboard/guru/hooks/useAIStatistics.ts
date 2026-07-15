'use client';

import { useEffect, useState } from 'react';
import type { AIUsageSummary } from '@/app/dashboard/guru/services/guru/statistics/aiUsage';
import { buildAIUsageSummary } from '@/app/dashboard/guru/services/guru/statistics/aiUsage';
import { loadStatisticsOverviewData } from '@/app/dashboard/guru/services/guru/statistics/overview';

export function useAIStatistics(classId: string, moduleId: number | 'all') {
  const [summary, setSummary] = useState<AIUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadStatisticsOverviewData();
        if (!active) return;
        setSummary(
          buildAIUsageSummary(
            data.students,
            data.identificationAnswers,
            data.applicationActivities,
            data.reflections,
            classId,
            moduleId
          )
        );
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat statistik AI Tutor.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [classId, moduleId]);

  return { summary, loading, error };
}
