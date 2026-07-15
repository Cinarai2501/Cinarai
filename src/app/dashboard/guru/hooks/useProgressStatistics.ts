'use client';

import { useEffect, useState } from 'react';
import type { BlueprintStageProgress } from '@/app/dashboard/guru/services/guru/statistics/progress';
import type { StatisticsDateRange } from '@/app/dashboard/guru/services/guru/statistics/overview';
import { buildBlueprintProgress } from '@/app/dashboard/guru/services/guru/statistics/progress';
import { getDateRange } from '@/app/dashboard/guru/services/guru/statistics/overview';
import { loadStatisticsOverviewData } from '@/app/dashboard/guru/services/guru/statistics/overview';

export function useProgressStatistics(moduleId: number | 'all', range: StatisticsDateRange) {
  const [progress, setProgress] = useState<BlueprintStageProgress[]>([]);
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
        const filtered = data.progressDocuments.filter((document) => {
          if (moduleId !== 'all' && document.comicId !== moduleId) return false;
          const updatedAt = (document.updatedAt as { toDate?: () => Date })?.toDate?.();
          if (!updatedAt) return false;
          if (start && updatedAt < start) return false;
          return updatedAt <= end;
        });
        if (!active) return;
        setProgress(buildBlueprintProgress(filtered, moduleId));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat statistik progress.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [moduleId, range]);

  return { progress, loading, error };
}
