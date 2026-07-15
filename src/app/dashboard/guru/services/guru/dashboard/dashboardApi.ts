import { getUserToken } from '@/lib/firebase/auth';
import type { ActivityDocument, ComicDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';

export type GuruDashboardApiResponse = {
  students: UserDocument[];
  comics: ComicDocument[];
  progressDocuments: ComicProgressDocument[];
  activities: ActivityDocument[];
  reflections: ReflectionDocument[];
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
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? 'Gagal memuat dashboard guru');
  }

  return response.json();
}
