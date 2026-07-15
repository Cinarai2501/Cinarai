'use client';

import { useEffect, useState } from 'react';
import type { ActivityTrendPoint } from '@/app/dashboard/guru/services/guru/statistics/activity';
import type { StatisticsDateRange } from '@/app/dashboard/guru/services/guru/statistics/overview';
import { buildActivityTrend } from '@/app/dashboard/guru/services/guru/statistics/activity';
import { getDateRange } from '@/app/dashboard/guru/services/guru/statistics/overview';
import { loadStatisticsOverviewData } from '@/app/dashboard/guru/services/guru/statistics/overview';

export function useActivityStatistics(classId: string, moduleId: number | 'all', range: StatisticsDateRange) {
  const [trend, setTrend] = useState<ActivityTrendPoint[]>([]);
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
        const { start, end } = getDateRange(range);
        setTrend(buildActivityTrend(data.activities, data.progressDocuments, data.students, classId, start, end));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat aktivitas belajar.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [classId, moduleId, range]);

  return { trend, loading, error };
}
