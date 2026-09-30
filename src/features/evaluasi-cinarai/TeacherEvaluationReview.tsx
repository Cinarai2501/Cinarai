'use client';

import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { firestore } from '@/lib/firebase/client';
import type { CinaraiChallengeId, CinaraiEvaluationProgress, CinaraiEvaluationScores } from '@/types/evaluation';
import { CHALLENGES, getEvaluationScore, RUBRIC_LEVELS } from './evaluationModel';

const fieldLabels: Record<string, string> = {
  selectedInformation: 'Informasi yang dipilih',
  explanation: 'Alasan',
  reasonedSpeaker: 'Alasan matematis',
  modelShape: 'Model bangun ruang',
  evidence: 'Bukti',
  formula: 'Rumus',
  calculation: 'Proses perhitungan',
  result: 'Hasil',
  verification: 'Pemeriksaan',
  strategy: 'Strategi yang dipilih',
  error: 'Letak kesalahan',
  proof: 'Pembuktian',
  bestAction: 'Tindakan',
  reason: 'Alasan',
  decision: 'Keputusan terhadap AI',
  conclusion: 'Kesimpulan',
  checks: 'Hal yang perlu diperiksa',
  claim: 'Klaim',
  why: 'Alasan pemilihan klaim',
  steps: 'Langkah transfer',
  aiDifferenceAction: 'Tindakan saat informasi AI berbeda',
  designChoice: 'Rancangan yang dipilih',
  evidence1: 'Bukti 1',
  evidence2: 'Bukti 2',
  evidence3: 'Bukti 3',
  integratedExplanation: 'Jawaban integratif',
};

const selectedInformationLabels: Record<string, string> = {
  length: 'Panjang model',
  width: 'Lebar model',
  height: 'Tinggi model',
  color: 'Warna model',
  table: 'Ukuran meja',
};

const aiActionLabels: Record<string, string> = {
  A: 'Mengikuti AI karena AI pasti benar.',
  B: 'Mengganti jawaban sendiri menjadi 620 cm³.',
  C: 'Memeriksa data, rumus, dan menghitung kembali.',
  D: 'Mengabaikan AI tanpa melakukan pemeriksaan.',
};

export default function TeacherEvaluationReview({
  studentId,
  evaluation,
}: {
  studentId: string;
  evaluation: CinaraiEvaluationProgress | null;
}) {
  const { user } = useAuth();
  const [scores, setScores] = useState<CinaraiEvaluationScores>(evaluation?.grading?.challengeScores ?? {});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setScores(evaluation?.grading?.challengeScores ?? {});
  }, [evaluation?.grading?.challengeScores]);

  if (!evaluation) return null;

  const totalScore = getEvaluationScore(scores);
  const saveGrade = async () => {
    if (!studentId || !user?.uid || totalScore === null) return;
    setSaveState('saving');
    setErrorMessage('');
    try {
      await updateDoc(doc(firestore, 'users', studentId, 'progress', 'evaluation-cinarai'), {
        'evaluationCinarai.grading': {
          status: 'graded',
          challengeScores: scores,
          totalScore,
          gradedBy: user.uid,
          gradedAt: serverTimestamp(),
          rubricVersion: 'cinarai-0-4-v1',
        },
        updatedAt: serverTimestamp(),
      });
      setSaveState('saved');
    } catch {
      setSaveState('error');
      setErrorMessage('Penilaian belum tersimpan. Periksa izin dan koneksi, lalu coba lagi.');
    }
  };

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm" aria-labelledby="cinarai-evaluation-review-title">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">Asesmen akhir</p>
      <h2 id="cinarai-evaluation-review-title" className="text-lg font-black text-neutral-900">Evaluasi CINARAI</h2>
      <p className="mt-2 text-sm font-semibold text-neutral-600">Status: {evaluation.completed ? evaluation.grading?.status === 'graded' ? 'Sudah dinilai' : 'Menunggu penilaian' : 'Draft siswa'}</p>
      {!evaluation.completed ? <p className="mt-3 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">Jawaban belum dikirim; penilaian rubric belum tersedia.</p> : <>
        <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <h3 className="text-sm font-extrabold text-neutral-900">Rubrik penilaian 0–4 per tantangan</h3>
          <ul className="mt-2 space-y-2 text-xs leading-relaxed text-neutral-700">{RUBRIC_LEVELS.map((level) => <li key={level.score}><strong>{level.score} · {level.label}:</strong> {level.description}</li>)}</ul>
        </div>

        <div className="mt-4 space-y-4">
          {CHALLENGES.map((challenge) => {
            const answers = evaluation.answers[challenge.id] as Record<string, unknown> | undefined;
            return <article key={challenge.id} className="rounded-xl border border-neutral-200 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><h3 className="font-extrabold text-neutral-900">{challenge.letter}. Tantangan {challenge.id.replace('challenge', '')} — {challenge.title}</h3><p className="mt-1 text-xs font-semibold text-neutral-500">Konstruk: {challenge.focus}</p></div>
                <label className="flex shrink-0 items-center gap-2 text-sm font-bold text-neutral-700">Skor
                  <select value={scores[challenge.id] ?? ''} onChange={(event) => {
                    const value = event.target.value;
                    setScores((current) => {
                      const next = { ...current };
                      if (value === '') delete next[challenge.id];
                      else next[challenge.id] = Number(value);
                      return next;
                    });
                    setSaveState('idle');
                  }} className="min-h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100" aria-label={`Skor rubric tantangan ${challenge.id.replace('challenge', '')}`}>
                    <option value="">Pilih</option>{RUBRIC_LEVELS.map((level) => <option key={level.score} value={level.score}>{level.score} · {level.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-3 space-y-2">{Object.entries(answers ?? {}).map(([key, answer]) => {
                const rendered = formatAnswer(challenge.id, key, answer);
                if (!rendered) return null;
                return <div key={key} className="rounded-lg bg-neutral-50 p-3"><p className="text-xs font-bold text-neutral-500">{fieldLabels[key] ?? key}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{rendered}</p></div>;
              })}</div>
            </article>;
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-primary-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-extrabold text-neutral-900">{totalScore === null ? 'Nilai total: lengkapi skor semua tantangan' : `Nilai total: ${totalScore} / 40`}</p>
          <button type="button" onClick={() => void saveGrade()} disabled={totalScore === null || saveState === 'saving'} className="min-h-11 rounded-xl bg-primary-600 px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">{saveState === 'saving' ? 'Menyimpan...' : saveState === 'saved' ? 'Penilaian tersimpan' : 'Simpan penilaian'}</button>
        </div>
        {errorMessage && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{errorMessage}</p>}
      </>}
    </section>
  );
}

function formatAnswer(challengeId: CinaraiChallengeId, key: string, value: unknown): string {
  if (Array.isArray(value)) {
    const items = value.map((item) => {
      if (typeof item !== 'string') return String(item);
      if (key === 'selectedInformation') return selectedInformationLabels[item] ?? item;
      return item;
    });
    return items.join(key === 'steps' ? '\n' : ', ');
  }
  if (typeof value !== 'string') return '';
  if (challengeId === 'challenge5' && key === 'bestAction') return aiActionLabels[value] ?? value;
  return value;
}