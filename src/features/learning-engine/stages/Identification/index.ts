// Layout utama
export { default as IdentificationLayout } from './components/IdentificationLayout';

// Step components
export { default as StepAmati } from './components/StepAmati';
export { default as StepIdentifikasi } from './components/StepIdentifikasi';
export { default as StepKonfirmasi } from './components/StepKonfirmasi';

// Step Konfirmasi sub-komponen
export { default as StepKonfirmasiItem } from './components/StepKonfirmasiItem';

// Identifikasi sub-komponen
export { default as IdentificationProgress } from './components/IdentificationProgress';
export { default as IdentificationActivity } from './components/IdentificationActivity';
export { default as ActivityItem } from './components/ActivityItem';
export { default as AnswerOptions } from './components/AnswerOptions';
export { default as NoteArea } from './components/NoteArea';
export { default as ReasonArea } from './components/ReasonArea';

// Context
export {
  IdentificationProvider,
  useIdentificationContext,
} from './context';
export type { IdentificationContextValue } from './context';

// Hook
export { useIdentification } from './hooks/useIdentification';

// Services
export {
  createIdentificationState,
  markItemObserved,
  setObserveNote,
  completeObserve,
  selectAnswer,
  updateNote,
  saveAnswer,
  updateReason,
  saveReason,
  resetIdentificationState,
} from './services/identificationService';

// Types
export type {
  IdentificationStep,
  AnswerOption,
  AnswerStatus,
  ReasonStatus,
  IdentificationItem,
  IdentificationItemStatus,
  IdentificationState,
  ObserveState,
  MarkObservedPayload,
  SelectAnswerPayload,
  UpdateNotePayload,
  SaveAnswerPayload,
} from './types';
