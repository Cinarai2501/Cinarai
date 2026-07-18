import { getUserToken } from '@/lib/firebase/auth';
import type { ActivityDocument, ComicDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';

export type GuruDashboardApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  students: UserDocument[];
  comics: ComicDocument[];
  progressDocuments: ComicProgressDocument[];
  activities: ActivityDocument[];
  reflections: ReflectionDocument[];
  analytics?: Array<Record<string, unknown>>;
  stats?: {
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

function normalizeDashboardPayload(payload: Partial<GuruDashboardApiResponse> | null | undefined): GuruDashboardApiResponse {
  return {
    success: payload?.success ?? true,
    message: payload?.message,
    error: payload?.error,
    students: Array.isArray(payload?.students) ? payload.students : [],
    comics: Array.isArray(payload?.comics) ? payload.comics : [],
    progressDocuments: Array.isArray(payload?.progressDocuments) ? payload.progressDocuments : [],
    activities: Array.isArray(payload?.activities) ? payload.activities : [],
    reflections: Array.isArray(payload?.reflections) ? payload.reflections : [],
    analytics: Array.isArray(payload?.analytics) ? payload.analytics : [],
    stats: payload?.stats ?? undefined,
    generatedAt: typeof payload?.generatedAt === 'string' ? payload.generatedAt : undefined,
  };
}

export async function fetchGuruDashboardFromApi(): Promise<GuruDashboardApiResponse> {
  const token = await getUserToken();
  if (!token) {
    throw new Error('Sesi guru tidak tersedia. Silakan masuk kembali.');
  }

  const response = await fetch('/api/dashboard/guru', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  let payload: Partial<GuruDashboardApiResponse> | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : `HTTP ${response.status}: Gagal memuat dashboard guru`;
    throw new Error(errorMessage);
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Respons API dashboard guru tidak valid');
  }

  return normalizeDashboardPayload(payload);
}
