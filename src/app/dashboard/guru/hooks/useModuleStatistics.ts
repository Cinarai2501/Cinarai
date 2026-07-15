'use client';

import { useEffect, useState } from 'react';
import type { ModuleProgressSummary } from '@/app/dashboard/guru/services/guru/statistics/module';
import { buildModuleProgressSummaries } from '@/app/dashboard/guru/services/guru/statistics/module';
import { loadStatisticsOverviewData } from '@/app/dashboard/guru/services/guru/statistics/overview';

export function useModuleStatistics(classId: string, moduleId: number | 'all') {
  const [modules, setModules] = useState<ModuleProgressSummary[]>([]);
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
        setModules(
          buildModuleProgressSummaries(data.comics, data.students, data.progressDocuments, classId, moduleId)
        );
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat progres modul.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [classId, moduleId]);

  return { modules, loading, error };
}
