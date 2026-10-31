'use client';

import { useRef, useState } from 'react';
import { auth } from '@/lib/firebase/client';
import type { AiInsight } from '../types';

interface StudentInsightResponse {
  ai?: {
    summary: string;
    findings: Array<{ text: string }>;
    recommendations: Array<{ category: string; text: string }>;
  } | null;
  aiError?: string | null;
  usage?: { provider?: string } | null;
}

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

  const generate = async (uid: string) => {
    if (!uid || selectedUid.current !== uid) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    setInsight(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Sesi login tidak tersedia. Silakan masuk kembali.');
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/dashboard/guru', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'student-insight', studentUid: uid }),
        cache: 'no-store',
      });
      const payload = await response.json() as { error?: string } | StudentInsightResponse;
      if (!response.ok) {
        throw new Error('error' in payload && payload.error
          ? payload.error
          : 'Analisis individu gagal dimuat.');
      }
      if (!('ai' in payload)) throw new Error('Format data analisis individu tidak valid.');
      if (!payload.ai) throw new Error(payload.aiError || 'Data belum cukup untuk menampilkan analisis AI.');

      const findings = payload.ai.findings.map((item) => item.text).filter(Boolean);
      const recommendations = payload.ai.recommendations;
      const mappedInsight: AiInsight = {
        capabilitySummary: payload.ai.summary,
        weakestStage: 'Lihat temuan berbasis bukti',
        bestStage: 'Lihat temuan berbasis bukti',
        errorPattern: findings.join(' '),
        teacherRecommendation: recommendations.map((item) => item.text).join(' '),
        remedial: recommendations
          .filter((item) => item.category === 'review' || item.category === 'support')
          .map((item) => item.text).join(' ') || 'Belum ada rekomendasi remedial berbasis bukti.',
        enrichment: recommendations
          .filter((item) => item.category === 'activity' || item.category === 'next_check')
          .map((item) => item.text).join(' ') || 'Belum ada rekomendasi pengayaan berbasis bukti.',
        provider: payload.usage?.provider,
      };
      if (selectedUid.current === uid && requestId.current === currentRequest) setInsight(mappedInsight);
    } catch (requestError) {
      if (selectedUid.current === uid && requestId.current === currentRequest) {
        setError(requestError instanceof Error ? requestError.message : 'Analisis individu gagal dimuat.');
      }
    } finally {
      if (selectedUid.current === uid && requestId.current === currentRequest) setLoading(false);
    }
  };

  return { insight, loading, error, generate, reset };
}
