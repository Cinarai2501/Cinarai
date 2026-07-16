import { getUserToken } from '@/lib/firebase/auth';
import type { ActivityDocument, ComicDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';

export type GuruDashboardApiResponse = {
  students: UserDocument[];
  comics: ComicDocument[];
  progressDocuments: ComicProgressDocument[];
  activities: ActivityDocument[];
  reflections: ReflectionDocument[];
  generatedAt?: string;
};

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

  if (!response.ok) {
    const payload = await response.json().catch(() => ({} as Record<string, unknown>));
    const errorMessage = typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
      ? payload.error
      : `HTTP ${response.status}: Gagal memuat dashboard guru`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Respons API dashboard guru tidak valid');
  }

  return data as GuruDashboardApiResponse;
}
