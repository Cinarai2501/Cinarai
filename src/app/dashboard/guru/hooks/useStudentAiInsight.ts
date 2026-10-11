'use client';

import { useState } from 'react';
import { useRef } from 'react';
import { generateStudentInsight } from '@/lib/ai/service';
import type { AiInsight } from '../types';
import type { ComicProgressDocument } from '@/types/firestore';

export function useStudentAiInsight() {
  const selectedUid = useRef<string | null>(null);
  const requestId = useRef(0);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = (uid: string | null = null) => {
    selectedUid.current = uid;
    requestId.current += 1;
    setInsight(null);
    setLoading(false);
    setError(null);
  };

  const generate = async (
    uid: string,
    studentName: string,
    progressList: ComicProgressDocument[],
    reflections: unknown[],
    activities: unknown[]
  ) => {
    if (!uid || selectedUid.current !== uid) return;
    if (progressList.length === 0 && reflections.length === 0 && activities.length === 0) {
      setInsight(null);
      setLoading(false);
      setError('Insight belum dapat dibuat karena belum ada data pembelajaran siswa.');
      return;
    }
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    setInsight(null);
    try {
      const result = await generateStudentInsight({
        studentName,
        progressDocuments: progressList.map((p) => ({
          comicId: p.comicId,
          percentage: p.percentage,
          status: p.status,
          completedStage: p.completedStage,
        })),
        reflections: (reflections as Array<Record<string, unknown>>).map((r) => ({
          rating: typeof r.rating === 'number' ? r.rating : null,
          stage: typeof r.stage === 'string' ? r.stage : undefined,
          response: typeof r.response === 'string' ? r.response : undefined,
          reflectionText: typeof r.reflectionText === 'string' ? r.reflectionText : undefined,
        })),
        activities: (activities as Array<Record<string, unknown>>).map((a) => ({
          title: typeof a.title === 'string' ? a.title : undefined,
          description: typeof a.description === 'string' ? a.description : undefined,
          occurredAt: a.occurredAt,
        })),
      });
      if (selectedUid.current === uid && requestId.current === currentRequest) {
        if (result.fallbackUsed) {
          setError('Layanan AI tidak tersedia. Tidak ada analisis yang ditampilkan.');
        } else {
          setInsight(result);
        }
      }
    } catch (err) {
      if (selectedUid.current === uid && requestId.current === currentRequest) {
        setError(err instanceof Error ? err.message : 'Gagal menghasilkan analisis AI');
      }
    } finally {
      if (selectedUid.current === uid && requestId.current === currentRequest) setLoading(false);
    }
  };

  return { insight, loading, error, generate, reset };
}
