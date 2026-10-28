import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export type GuruReadStatus = 'success' | 'not_found' | 'partial' | 'error';

export type GuruSourceStatus = 'available' | 'not_found' | 'error';

export type GuruTimestamp =
  | { status: 'valid'; value: Date }
  | { status: 'unavailable'; reason: 'missing' | 'invalid' };

export type GuruMetric =
  | { value: number; origin: 'stored' | 'derived' }
  | { value: null; origin: 'unavailable' };

export type GuruProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'unknown';

export type GuruStageStatus =
  | 'completed'
  | 'current'
  | 'not_started'
  | 'unknown';

export interface GuruSourceResult {
  status: GuruSourceStatus;
  error?: {
    code: string;
    message: string;
  };
}

export interface GuruDataResult<T> {
  status: GuruReadStatus;
  data: T | null;
  sources: Record<string, GuruSourceResult>;
  error?: {
    code: string;
    message: string;
  };
}

export interface GuruStudentSummary {
  uid: string;
  displayName: string | null;
  email: string | null;
  classLevel: string | null;
  schoolName: string | null;
  isActive: boolean | null;
  duplicate: boolean;
  progress: {
    state: 'not_loaded' | 'unavailable' | GuruProgressStatus;
    completedComicCount: GuruMetric;
    knownComicCount: number | null;
  };
}

export interface GuruComicProgress {
  uid: string;
  comicId: number;
  documentId: string;
  format: 'v2' | 'legacy';
  stored: {
    currentStage: string | null;
    completedStages: string[] | null;
    percentage: number | null;
    status: 'not_started' | 'in_progress' | 'completed' | null;
  };
  percentage: GuruMetric;
  status: GuruProgressStatus;
  stages: Array<{
    stage: string;
    status: GuruStageStatus;
  }>;
  updatedAt: GuruTimestamp;
}

export interface GuruIdentificationAnswer {
  uid: string;
  comicId: number;
  step: number;
  answer: string | null;
  reason: string | null;
  note: string | null;
  origin: 'identification_answers' | 'stageData';
  documentId: string | null;
  updatedAt: GuruTimestamp;
}

export interface GuruStudentProgress {
  comics: GuruComicProgress[];
  identificationAnswers: GuruIdentificationAnswer[];
}

export type GuruEvaluationStatus =
  | 'not_found'
  | 'draft'
  | 'awaiting_grading'
  | 'graded'
  | 'invalid';

export interface GuruEvaluationSummary {
  uid: string;
  status: GuruEvaluationStatus;
  completed: boolean | null;
  gradingStatus: 'pending' | 'graded' | 'unknown';
  teacherRubricTotal: GuruMetric;
  submittedAt: GuruTimestamp;
  gradedAt: GuruTimestamp;
}

export interface GuruReflectionSummary {
  id: string;
  uid: string;
  comicId: number | null;
  text: string | null;
  status: string | null;
  submittedAt: GuruTimestamp;
}

export interface GuruStudentActivity {
  id: string;
  uid: string;
  comicId: number | null;
  attempt: number | null;
  selectedAnswer: string | null;
  studentReason: string | null;
  coachType: string | null;
  coachMessage: string | null;
  timestamp: GuruTimestamp;
}

export interface GuruStudentActivityPage {
  activities: GuruStudentActivity[];
  nextCursor: QueryDocumentSnapshot<DocumentData> | null;
}

export interface GuruStudentPage {
  students: GuruStudentSummary[];
  nextCursor: QueryDocumentSnapshot<DocumentData> | null;
}
