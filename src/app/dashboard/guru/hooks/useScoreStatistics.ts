'use client';

import { useEffect, useState } from 'react';
import type { ScoreBucket } from '@/app/dashboard/guru/services/guru/statistics/score';
import { buildScoreDistribution } from '@/app/dashboard/guru/services/guru/statistics/score';
import { loadStatisticsOverviewData } from '@/app/dashboard/guru/services/guru/statistics/overview';

export function useScoreStatistics(classId: string, moduleId: number | 'all') {
  const [distribution, setDistribution] = useState<ScoreBucket[]>([]);
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
        setDistribution(
          buildScoreDistribution(data.students, data.reflections, data.progressDocuments, classId, moduleId)
        );
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat distribusi nilai.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [classId, moduleId]);

  return { distribution, loading, error };
}
