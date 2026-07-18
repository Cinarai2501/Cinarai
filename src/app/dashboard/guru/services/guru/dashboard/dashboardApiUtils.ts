import type { ActivityDocument, ComicDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';

export type SafeGuruDashboardApiResponse = {
  success: boolean;
  message?: string;
  error?: string;
  errors?: { [key: string]: string | undefined };
  students: UserDocument[];
  comics: ComicDocument[];
  progressDocuments: ComicProgressDocument[];
  activities: ActivityDocument[];
  reflections: ReflectionDocument[];
  analytics: Array<Record<string, unknown>>;
  stats: {
    totalStudents: number;
    activeStudents: number;
    totalModules: number;
    averageProgress: number;
    completedModules: number;
    reflectionCount: number;
    recentActivityCount: number;
  };
  generatedAt?: string;
};

export function normalizeDashboardPayload(payload: Partial<SafeGuruDashboardApiResponse> | null | undefined): SafeGuruDashboardApiResponse {
  return {
    success: payload?.success ?? true,
    message: payload?.message,
    error: payload?.error,
    errors: payload?.errors ?? {},
    students: Array.isArray(payload?.students) ? payload.students : [],
    comics: Array.isArray(payload?.comics) ? payload.comics : [],
    progressDocuments: Array.isArray(payload?.progressDocuments) ? payload.progressDocuments : [],
    activities: Array.isArray(payload?.activities) ? payload.activities : [],
    reflections: Array.isArray(payload?.reflections) ? payload.reflections : [],
    analytics: Array.isArray(payload?.analytics) ? payload.analytics : [],
    stats: payload?.stats ?? {
      totalStudents: 0,
      activeStudents: 0,
      totalModules: 0,
      averageProgress: 0,
      completedModules: 0,
      reflectionCount: 0,
      recentActivityCount: 0,
    },
    generatedAt: typeof payload?.generatedAt === 'string' ? payload.generatedAt : undefined,
  };
}
