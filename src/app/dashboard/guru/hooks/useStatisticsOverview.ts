'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  StatisticsClassOption,
  StatisticsFilter,
  StatisticsModuleOption,
  StatisticsOverview,
  StatisticsTimeOption,
} from '@/app/dashboard/guru/services/guru/statistics/overview';
import {
  buildClassOptions,
  buildModuleOptions,
  buildStatisticsOverview,
  loadStatisticsOverviewData,
} from '@/app/dashboard/guru/services/guru/statistics/overview';

const defaultTimeOptions: StatisticsTimeOption[] = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7days', label: '7 Hari' },
  { id: '30days', label: '30 Hari' },
  { id: 'semester', label: 'Semester' },
  { id: 'all', label: 'Semua' },
];

export function useStatisticsOverview(filter: StatisticsFilter) {
  const [overview, setOverview] = useState<StatisticsOverview | null>(null);
  const [classOptions, setClassOptions] = useState<StatisticsClassOption[]>([]);
  const [moduleOptions, setModuleOptions] = useState<StatisticsModuleOption[]>([]);
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

        setClassOptions(buildClassOptions(data.students));
        setModuleOptions(buildModuleOptions(data.comics));
        setOverview(
          buildStatisticsOverview(
            data.students,
            data.progressDocuments,
            data.reflections,
            data.identificationAnswers,
            data.applicationActivities,
            filter.classId,
            filter.moduleId
          )
        );
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan statistik.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [filter.classId, filter.moduleId]);

  const timeOptions = useMemo(() => defaultTimeOptions, []);

  return {
    overview,
    classOptions,
    moduleOptions,
    timeOptions,
    loading,
    error,
  };
}
