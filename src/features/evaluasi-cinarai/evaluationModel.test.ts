import assert from 'node:assert/strict';
import test from 'node:test';
import type { CinaraiChallengeId, CinaraiEvaluationAnswers, CinaraiEvaluationScores } from '@/types/evaluation';
import { CHALLENGES, getEvaluationScore, isChallengeComplete } from './evaluationModel';

test('defines the ten evaluation challenges in the required order', () => {
  assert.deepEqual(CHALLENGES.map(({ id }) => id), [
    'challenge1', 'challenge2', 'challenge3', 'challenge4', 'challenge5',
    'challenge6', 'challenge7', 'challenge8', 'challenge9', 'challenge10',
  ]);
});

test('requires the explanation alongside relevant-information selections', () => {
  const answers: CinaraiEvaluationAnswers = {
    challenge1: { selectedInformation: ['length', 'width', 'height'] },
  };
  assert.equal(isChallengeComplete('challenge1', answers), false);
  answers.challenge1 = { ...answers.challenge1, explanation: 'Ukuran balok digunakan untuk menghitung volumenya.' };
  assert.equal(isChallengeComplete('challenge1', answers), true);
});

test('validates structured responses across all ten challenges', () => {
  const completeAnswers: CinaraiEvaluationAnswers = {
    challenge1: { selectedInformation: ['length', 'width', 'height'], explanation: 'Informasi ukuran diperlukan.' },
    challenge2: { reasonedSpeaker: 'Ara', modelShape: 'Balok', evidence: 'Tiga pasang sisi berhadapan sama besar.' },
    challenge3: { formula: 'p × l × t', calculation: '15 × 8 × 6', result: '720 cm³', verification: 'Mengalikan ulang.' },
    challenge4: { strategy: 'Aris', error: 'Menjumlahkan ukuran.', proof: 'Volume memakai perkalian.' },
    challenge5: { bestAction: 'C', reason: 'Jawaban AI perlu diperiksa.', verification: '15 × 8 × 6 = 720.', decision: 'Ditolak', evidence: 'Hasil hitung berbeda.' },
    challenge6: { conclusion: 'Belum tentu tepat', reason: 'Model tidak sama dengan objek nyata.', checks: 'Amati ukuran dan sisi.' },
    challenge7: { claim: 'Klaim B', why: 'Menyebut sifat bangun.', evidence: 'Tiga pasang sisi berhadapan.' },
    challenge8: { steps: ['Amati sisi.', 'Catat ukuran.', 'Bandingkan bukti.'], aiDifferenceAction: 'Periksa kembali bukti.' },
    challenge9: { designChoice: 'Rancangan B', evidence1: 'Ukuran dicantumkan.', evidence2: 'Ada perhitungan.', evidence3: 'Saran AI diperiksa.', conclusion: 'B lebih dapat dipertanggungjawabkan.' },
    challenge10: { integratedExplanation: 'AR membantu mengamati, AI memberi informasi, matematika dan bukti mendasari keputusan.' },
  };

  for (const { id } of CHALLENGES) {
    assert.equal(isChallengeComplete(id, completeAnswers), true, `${id} should accept all required response sections`);
  }

  const incompleteAnswers: Array<[CinaraiChallengeId, CinaraiEvaluationAnswers]> = [
    ['challenge1', { ...completeAnswers, challenge1: { ...completeAnswers.challenge1, selectedInformation: [] } }],
    ['challenge2', { ...completeAnswers, challenge2: { ...completeAnswers.challenge2, evidence: '' } }],
    ['challenge3', { ...completeAnswers, challenge3: { ...completeAnswers.challenge3, calculation: '' } }],
    ['challenge4', { ...completeAnswers, challenge4: { ...completeAnswers.challenge4, proof: '' } }],
    ['challenge5', { ...completeAnswers, challenge5: { ...completeAnswers.challenge5, verification: '' } }],
    ['challenge6', { ...completeAnswers, challenge6: { ...completeAnswers.challenge6, checks: '' } }],
    ['challenge7', { ...completeAnswers, challenge7: { ...completeAnswers.challenge7, evidence: '' } }],
    ['challenge8', { ...completeAnswers, challenge8: { ...completeAnswers.challenge8, steps: ['Amati sisi.', '', 'Bandingkan bukti.'] } }],
    ['challenge9', { ...completeAnswers, challenge9: { ...completeAnswers.challenge9, evidence3: '' } }],
    ['challenge10', { ...completeAnswers, challenge10: { integratedExplanation: '' } }],
  ];

  for (const [id, answers] of incompleteAnswers) {
    assert.equal(isChallengeComplete(id, answers), false, `${id} should require its structured response sections`);
  }
});

test('requires three transfer steps and a response about conflicting AI information', () => {
  const answers: CinaraiEvaluationAnswers = {
    challenge8: { steps: ['Amati sisi', 'Catat ukuran', 'Bandingkan bukti'], aiDifferenceAction: '' },
  };
  assert.equal(isChallengeComplete('challenge8', answers), false);
  answers.challenge8 = { ...answers.challenge8, aiDifferenceAction: 'Periksa ulang pengamatan dan sumber.' };
  assert.equal(isChallengeComplete('challenge8', answers), true);
  answers.challenge8 = { ...answers.challenge8, steps: ['Amati sisi', 'Catat ukuran', ''] };
  assert.equal(isChallengeComplete('challenge8', answers), false);
});

test('totals the ten teacher-assigned rubric scores and rejects incomplete scores', () => {
  const scores = Object.fromEntries(CHALLENGES.map(({ id }, index) => [id, index % 5])) as Record<CinaraiChallengeId, number>;
  assert.equal(getEvaluationScore(scores), 20);
  assert.equal(getEvaluationScore({ ...scores, challenge4: undefined } as CinaraiEvaluationScores), null);
  assert.equal(getEvaluationScore({ ...scores, challenge4: 5 } as CinaraiEvaluationScores), null);
});