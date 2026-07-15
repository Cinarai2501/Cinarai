import type { Timestamp, FieldValue } from 'firebase/firestore';
import type { SintaksProgress } from '@/types/progress';

export type FirestoreTimestamp = Timestamp;

export type UserRole = 'student' | 'teacher' | 'admin';

export type ActivityType =
  | 'login'
  | 'lesson_started'
  | 'lesson_completed'
  | 'comic_started'
  | 'comic_completed'
  | 'reflection_submitted'
  | 'badge_earned';

export interface FirestoreBaseDocument {
  id?: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

export interface UserDocument extends FirestoreBaseDocument {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  schoolName?: string;
  gradeLevel?: number;
  isActive: boolean;
  lastLoginAt?: FirestoreTimestamp;
}

export interface ProgressDocument extends FirestoreBaseDocument {
  userId: string;
  moduleId: string;
  lessonId?: string;
  score: number;
  completedItems: number;
  totalItems: number;
  isCompleted: boolean;
  completedAt?: FirestoreTimestamp;
}

export interface IntrospectionProgressMetadata {
  completed?: boolean;
  checklist?: Array<{ prompt: string; checked: boolean }>;
  confidence?: number | null;
  reflectionText?: string;
  aiReflection?: {
    appreciation: string;
    needsImprovement: string;
    suggestion: string;
  };
  completedAt?: FirestoreTimestamp | FieldValue;
}

export interface ComicProgressDocument {
  id?: string;
  userId?: string;
  createdAt?: FirestoreTimestamp;
  comicId: number;
  completedStage: string;
  completedPages: number;
  percentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  sintaksList: SintaksProgress[];
  introspection?: IntrospectionProgressMetadata;
  completedAt?: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp | FieldValue;
}

export interface ReflectionDocument extends FirestoreBaseDocument {
  userId?: string;
  studentId?: string;
  moduleId?: string;
  comicId?: string;
  prompt?: string;
  response?: string;
  selectedChecklist?: string[];
  checklist?: string[];
  rating?: number | null;
  confidence?: number | null;
  reflectionText?: string;
  aiReflection?: {
    appreciation: string;
    needsImprovement: string;
    suggestion: string;
  } | string;
  jawaban?: Record<string, string>;
  timestamp?: FirestoreTimestamp | FieldValue;
  stage?: string;
  status?: 'completed' | string;
  submittedAt?: FirestoreTimestamp | FieldValue;
}

export interface LeaderboardDocument extends FirestoreBaseDocument {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalScore: number;
  rank?: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface BadgeDocument extends FirestoreBaseDocument {
  userId: string;
  badgeId: string;
  name: string;
  description?: string;
  iconURL?: string;
  earnedAt: FirestoreTimestamp;
}

export interface ActivityDocument extends FirestoreBaseDocument {
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, string | number | boolean | null>;
  occurredAt: FirestoreTimestamp;
}

export interface IdentificationAnswerDocument extends FirestoreBaseDocument {
  userId: string;
  comicId: number;
  step: number;
  selectedAnswer: string | null;
  selectedAnswerIds?: string[];
  correctAnswer?: string | null;
  selectedShapes?: string[];
  aiTutorUsed?: boolean;
  attemptCount?: number;
  note: string;
  reason: string;
  createdAt?: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ApplicationActivityDocument extends FirestoreBaseDocument {
  userId: string;
  comicId: number;
  selectedAnswer: string;
  studentReason: string;
  attempt: number;
  coachType: string;
  coachMessage: string;
  coachSummary: {
    mastered: string[];
    needsImprovement: string[];
    nextPractice: string[];
  };
  arViewed?: boolean;
  explorationCompleted?: boolean;
  timestamp?: FirestoreTimestamp | string;
  localTimestamp?: string;
  synced?: boolean;
}

export interface ComicCharacterDocument {
  name: string;
  role: string;
  description: string;
  avatar: string;
}

export interface ComicDocument extends FirestoreBaseDocument {
  /** Numeric ID: 1–5 */
  comicId: number;
  slug: string;
  title: string;
  subtitle: string;
  kelas: string;
  lokasi: string;
  synopsis: string;
  characters: ComicCharacterDocument[];
  learningTargets: string[];
  estimatedMinutes: number;
  pdfUrl: string | null;
  coverUrl: string;
  thumbnailUrl: string;
  order: number;
  availability: 'ACTIVE' | 'COMING_SOON';
}

export interface FirestoreCollectionMap {
  users: UserDocument;
  progress: ProgressDocument;
  reflection: ReflectionDocument;
  leaderboard: LeaderboardDocument;
  badge: BadgeDocument;
  activity: ActivityDocument;
  identification_answers: IdentificationAnswerDocument;
  application_activity: ApplicationActivityDocument;
  comics: ComicDocument;
}
