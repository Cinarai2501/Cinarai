import type {
  CinaraiChallengeId,
  CinaraiEvaluationAnswers,
  CinaraiEvaluationScores,
} from '@/types/evaluation';

export const CHALLENGES = [
  { id: 'challenge1', letter: 'A', title: 'Pilih Informasi yang Relevan', focus: 'Information selection' },
  { id: 'challenge2', letter: 'B', title: 'Pilih Representasi yang Tepat', focus: 'Mathematical representation' },
  { id: 'challenge3', letter: 'C', title: 'Pecahkan Masalah Numerasi', focus: 'Mathematical procedure' },
  { id: 'challenge4', letter: 'D', title: 'Temukan Kesalahan', focus: 'Error analysis' },
  { id: 'challenge5', letter: 'E', title: 'Jangan Langsung Percaya AI!', focus: 'AI output evaluation' },
  { id: 'challenge6', letter: 'F', title: 'Matematika dalam Candi Jawi', focus: 'Modeling awareness' },
  { id: 'challenge7', letter: 'G', title: 'Bandingkan Dua Klaim', focus: 'Evidence evaluation' },
  { id: 'challenge8', letter: 'H', title: 'Transfer ke Konteks Baru', focus: 'Transfer' },
  { id: 'challenge9', letter: 'I', title: 'Ambil Keputusan', focus: 'Decision making' },
  { id: 'challenge10', letter: 'J', title: 'Soal Puncak CINARAI', focus: 'Justification' },
] as const satisfies ReadonlyArray<{ id: CinaraiChallengeId; letter: string; title: string; focus: string }>;

export const RUBRIC_LEVELS = [
  { score: 4, label: 'Sangat kuat', description: 'Jawaban tepat, proses matematis benar, menggunakan bukti relevan, dan memberikan justifikasi/interpretasi yang kuat.' },
  { score: 3, label: 'Kuat', description: 'Jawaban tepat dan proses umumnya benar, tetapi justifikasi atau interpretasi belum lengkap.' },
  { score: 2, label: 'Berkembang', description: 'Menunjukkan sebagian pemahaman, tetapi terdapat kesalahan strategi/perhitungan atau bukti belum memadai.' },
  { score: 1, label: 'Perlu dukungan', description: 'Jawaban sangat terbatas; strategi atau alasan belum menunjukkan pemahaman konsep.' },
  { score: 0, label: 'Belum ada bukti', description: 'Tidak menjawab atau jawaban tidak relevan.' },
] as const;

const hasText = (value?: string) => Boolean(value?.trim());

export function isChallengeComplete(
  id: CinaraiChallengeId,
  answers: CinaraiEvaluationAnswers
): boolean {
  switch (id) {
    case 'challenge1':
      return Boolean(answers.challenge1?.selectedInformation?.length)
        && hasText(answers.challenge1?.explanation);
    case 'challenge2':
      return hasText(answers.challenge2?.reasonedSpeaker)
        && hasText(answers.challenge2?.modelShape)
        && hasText(answers.challenge2?.evidence);
    case 'challenge3':
      return hasText(answers.challenge3?.formula)
        && hasText(answers.challenge3?.calculation)
        && hasText(answers.challenge3?.result)
        && hasText(answers.challenge3?.verification);
    case 'challenge4':
      return hasText(answers.challenge4?.strategy)
        && hasText(answers.challenge4?.error)
        && hasText(answers.challenge4?.proof);
    case 'challenge5':
      return hasText(answers.challenge5?.bestAction)
        && hasText(answers.challenge5?.reason)
        && hasText(answers.challenge5?.verification)
        && hasText(answers.challenge5?.decision)
        && hasText(answers.challenge5?.evidence);
    case 'challenge6':
      return hasText(answers.challenge6?.conclusion)
        && hasText(answers.challenge6?.reason)
        && hasText(answers.challenge6?.checks);
    case 'challenge7':
      return hasText(answers.challenge7?.claim)
        && hasText(answers.challenge7?.why)
        && hasText(answers.challenge7?.evidence);
    case 'challenge8':
      return Boolean(answers.challenge8?.steps?.slice(0, 3).every(hasText))
        && hasText(answers.challenge8?.aiDifferenceAction);
    case 'challenge9':
      return hasText(answers.challenge9?.designChoice)
        && hasText(answers.challenge9?.evidence1)
        && hasText(answers.challenge9?.evidence2)
        && hasText(answers.challenge9?.evidence3)
        && hasText(answers.challenge9?.conclusion);
    case 'challenge10':
      return hasText(answers.challenge10?.integratedExplanation);
  }
}

export function getEvaluationScore(scores: CinaraiEvaluationScores): number | null {
  if (!CHALLENGES.every(({ id }) => {
    const score = scores[id];
    return Number.isInteger(score) && score !== undefined && score >= 0 && score <= 4;
  })) return null;
  return CHALLENGES.reduce((total, { id }) => total + (scores[id] ?? 0), 0);
}