'use client';

import { useEffect, useRef, useState } from 'react';
import { auth } from '@/lib/firebase/client';
import { readJsonResponse } from '@/lib/api/readJsonResponse';
import { releaseAiRequestLock, tryAcquireAiRequestLock } from '../ai/aiRequestLock';
import type { AiInsight } from '../types';

interface StudentInsightResponse {
  ai?: {
    summary: string;
    findings: Array<{ text: string }>;
    recommendations: Array<{ category: string; text: string }>;
  } | null;
  aiError?: string | null;
  usage?: { provider?: string } | null;
  analysisGeneratedAt?: string;
  cacheHit?: boolean;
  cacheWarning?: string | null;
}

export function useStudentAiInsight() {
  const selectedUid = useRef<string | null>(null);
  const requestId = useRef(0);
  const requestInFlight = useRef(false);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [analysisGeneratedAt, setAnalysisGeneratedAt] = useState<string | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [cacheWarning, setCacheWarning] = useState<string | null>(null);

  useEffect(() => {
    if (retryAfterSeconds <= 0) return;
    const timer = window.setTimeout(() => setRetryAfterSeconds((remaining) => Math.max(0, remaining - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [retryAfterSeconds]);

  const reset = (uid: string | null = null) => {
    selectedUid.current = uid;
    requestId.current += 1;
    setInsight(null);
    setLoading(false);
    setError(null);
    setRetryAfterSeconds(0);
    setAnalysisGeneratedAt(null);
    setCacheHit(false);
    setCacheWarning(null);
  };

  const generate = async (uid: string, forceRefresh = false) => {
    if (!uid || selectedUid.current !== uid || !tryAcquireAiRequestLock(requestInFlight)) return;
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    setCacheWarning(null);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Sesi login tidak tersedia. Silakan masuk kembali.');
      const token = await currentUser.getIdToken();
      const endpoint = '/api/dashboard/guru';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'student-insight', studentUid: uid, refresh: forceRefresh }),
        cache: 'no-store',
      });
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After'));
        if (selectedUid.current === uid && requestId.current === currentRequest) {
          setRetryAfterSeconds(Number.isFinite(retryAfter) ? Math.max(1, retryAfter) : 1);
        }
      }
      const payload = await readJsonResponse<{ error?: string } | StudentInsightResponse>(response, endpoint);
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
      if (selectedUid.current === uid && requestId.current === currentRequest) {
        setInsight(mappedInsight);
        setAnalysisGeneratedAt(payload.analysisGeneratedAt ?? null);
        setCacheHit(payload.cacheHit === true);
        setCacheWarning(payload.cacheWarning ?? null);
      }
    } catch (requestError) {
      if (selectedUid.current === uid && requestId.current === currentRequest) {
        setError(requestError instanceof Error ? requestError.message : 'Analisis individu gagal dimuat.');
      }
    } finally {
      releaseAiRequestLock(requestInFlight);
      if (selectedUid.current === uid && requestId.current === currentRequest) setLoading(false);
    }
  };

  return {
    insight,
    loading,
    error,
    retryAfterSeconds,
    analysisGeneratedAt,
    cacheHit,
    cacheWarning,
    generate,
    reset,
  };
}
