'use client';

import { useEffect, useState } from 'react';
import type { AttentionRow, LeaderboardRow } from '@/app/dashboard/guru/services/guru/statistics/leaderboard';
import { buildAttentionLists, buildLeaderboard } from '@/app/dashboard/guru/services/guru/statistics/leaderboard';
import { loadStatisticsOverviewData } from '@/app/dashboard/guru/services/guru/statistics/overview';

export function useLeaderboard(classId: string, moduleId: number | 'all') {
  const [leaderboard, setLeaderboard] = useState<{ topProgress: LeaderboardRow[]; topScore: LeaderboardRow[]; topConsistency: LeaderboardRow[] } | null>(null);
  const [attention, setAttention] = useState<{ inactive: AttentionRow[]; lowProgress: AttentionRow[]; notCompleted: AttentionRow[]; noReflection: AttentionRow[] } | null>(null);
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
        setLeaderboard(buildLeaderboard(data.students, data.activities, data.progressDocuments, data.reflections, classId, moduleId));
        setAttention(buildAttentionLists(data.students, data.activities, data.progressDocuments, data.reflections, classId, moduleId));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Gagal memuat leaderboard guru.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [classId, moduleId]);

  return { leaderboard, attention, loading, error };
}
