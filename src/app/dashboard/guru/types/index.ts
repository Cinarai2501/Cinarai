import type { ComicProgressDocument, UserDocument, ComicDocument } from '@/types/firestore';

export type { UserDocument, ComicDocument, ComicProgressDocument };

export interface StudentRow {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  schoolName: string;
  classLevel: UserDocument['classLevel'] | null;
  gradeLevel: number | null;
  isActive: boolean;
  progressList: ComicProgressDocument[];
  averageProgress: number;
  completedComics: number;
  lastActivity: string;
}

export interface DashboardSummary {
  totalStudents: number;
  totalComics: number;
  activeStudents: number;
  attentionStudents: number;
  notStartedStudents: number;
  studentsCompleted: number;
  progressDocuments: number;
  totalCompleted: number;
  completionRate: number;
  averageProgress: number;
}

export type StudentStatusFilter = 'all' | 'not_started' | 'learning' | 'attention' | 'completed';
export type StudentLearningStatus = 'learning' | 'attention' | 'completed' | 'not_started';

export interface AiInsight {
  capabilitySummary: string;
  weakestStage: string;
  bestStage: string;
  errorPattern: string;
  teacherRecommendation: string;
  remedial: string;
  enrichment: string;
  provider?: string;
  fallbackUsed?: boolean;
}
