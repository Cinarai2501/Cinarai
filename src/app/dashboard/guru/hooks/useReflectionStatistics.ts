'use client';

import { useEffect, useState } from 'react';
import type { ReflectionSummary } from '@/app/dashboard/guru/services/guru/statistics/reflection';
import { buildReflectionSummary } from '@/app/dashboard/guru/services/guru/statistics/reflection';
import { loadStatisticsOverviewData } from '@/app/dashboard/guru/services/guru/statistics/overview';

export function useReflectionStatistics(classId: string, moduleId: number | 'all') {
  const [summary, setSummary] = useState<ReflectionSummary | null>(null);
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
        setSummary(buildReflectionSummary(data.students, data.progressDocuments, data.reflections, classId, moduleId));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat statistik refleksi.');
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
