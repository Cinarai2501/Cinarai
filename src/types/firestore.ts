import type { Timestamp } from 'firebase/firestore';

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

export interface ComicProgressDocument extends FirestoreBaseDocument {
  userId: string;
  comicId: string;
  chapterId?: string;
  currentPage: number;
  totalPages: number;
  isCompleted: boolean;
  completedAt?: FirestoreTimestamp;
}

export interface ReflectionDocument extends FirestoreBaseDocument {
  userId: string;
  moduleId?: string;
  comicId?: string;
  prompt: string;
  response: string;
  submittedAt: FirestoreTimestamp;
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

export interface FirestoreCollectionMap {
  users: UserDocument;
  progress: ProgressDocument;
  comic_progress: ComicProgressDocument;
  reflection: ReflectionDocument;
  leaderboard: LeaderboardDocument;
  badge: BadgeDocument;
  activity: ActivityDocument;
}
