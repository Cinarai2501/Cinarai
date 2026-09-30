export type CinaraiChallengeId =
  | 'challenge1'
  | 'challenge2'
  | 'challenge3'
  | 'challenge4'
  | 'challenge5'
  | 'challenge6'
  | 'challenge7'
  | 'challenge8'
  | 'challenge9'
  | 'challenge10';

export type CinaraiEvaluationAnswers = {
  challenge1?: { selectedInformation?: string[]; explanation?: string };
  challenge2?: { reasonedSpeaker?: string; modelShape?: string; evidence?: string };
  challenge3?: { formula?: string; calculation?: string; result?: string; verification?: string };
  challenge4?: { strategy?: string; error?: string; proof?: string };
  challenge5?: { bestAction?: string; reason?: string; verification?: string; decision?: string; evidence?: string };
  challenge6?: { conclusion?: string; reason?: string; checks?: string };
  challenge7?: { claim?: string; why?: string; evidence?: string };
  challenge8?: { steps?: string[]; aiDifferenceAction?: string };
  challenge9?: { designChoice?: string; evidence1?: string; evidence2?: string; evidence3?: string; conclusion?: string };
  challenge10?: { integratedExplanation?: string };
};

export type CinaraiEvaluationScores = Partial<Record<CinaraiChallengeId, number>>;

export interface CinaraiEvaluationGrade {
  status: 'pending' | 'graded';
  challengeScores?: CinaraiEvaluationScores;
  totalScore?: number;
  gradedBy?: string;
  gradedAt?: unknown;
  rubricVersion: 'cinarai-0-4-v1';
}

export interface CinaraiEvaluationProgress {
  currentChallenge: number;
  answers: CinaraiEvaluationAnswers;
  completed: boolean;
  submittedAt?: unknown;
  grading?: CinaraiEvaluationGrade;
}

export interface CinaraiEvaluationProgressDocument {
  evaluationCinarai: CinaraiEvaluationProgress;
  updatedAt?: unknown;
}