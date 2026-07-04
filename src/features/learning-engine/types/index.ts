import type { Comic } from '@/types/comic';
import type { ComicProgressState, Sintaks, SintaksStatus } from '@/types/progress';

export type { Sintaks, SintaksStatus };

/** Enum — sumber kebenaran untuk Stage Router. Tidak ada string hardcode di router. */
export enum Stage {
  Cover           = 'Cover',
  Contextualization = 'Contextualization',
  Identification  = 'Identification',
  Navigation      = 'Navigation',
  Argumentation   = 'Argumentation',
  Resolution      = 'Resolution',
  Application     = 'Application',
  Introspection   = 'Introspection',
  Finish          = 'Finish',
}

/** Urutan stage pembelajaran (tanpa Finish) — dipakai context & Firestore */
export const LEARNING_STAGES: Stage[] = [
  Stage.Cover,
  Stage.Contextualization,
  Stage.Identification,
  Stage.Navigation,
  Stage.Argumentation,
  Stage.Resolution,
  Stage.Application,
  Stage.Introspection,
];

/** Semua stage termasuk Finish — dipakai untuk navigasi index */
export const ALL_STAGES: Stage[] = [...LEARNING_STAGES, Stage.Finish];

export type LearningStage = Stage;

/** Full context value exposed to all stages — no prop drilling needed */
export interface LearningContextValue {
  // Data
  comicId: number;
  comic: Comic;
  progress: ComicProgressState;
  currentStage: Stage;
  completedStages: Sintaks[];
  isFinished: boolean;
  isLoading: boolean;
  stageIndex: number;
  totalStages: number;

  // Navigation
  nextStage: () => Promise<void>;
  /** Save sintaks ke Firestore lalu langsung advance — tanpa cek canAdvance gate. */
  completeAndAdvance: (sintaks: Sintaks) => Promise<void>;
  previousStage: () => void;
  goToStage: (stage: Stage) => void;

  // Actions
  finishLearning: () => void;

  // Stage gate — stage dapat mengunci/membuka tombol Next
  canAdvance: boolean;
  setCanAdvance: (value: boolean) => void;

  // Save state — true while Firestore write is in-flight
  isSaving: boolean;
}
