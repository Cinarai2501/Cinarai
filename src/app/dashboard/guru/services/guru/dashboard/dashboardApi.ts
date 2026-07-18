import { getUserToken } from '@/lib/firebase/auth';
import { normalizeDashboardPayload } from './dashboardApiUtils';

export type GuruDashboardApiResponse = ReturnType<typeof normalizeDashboardPayload>;

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

  // If response is not ok, do not throw — normalize and return payload so UI can render partial data per-widget.
  if (!payload || typeof payload !== 'object') {
    // return an empty safe payload
    return normalizeDashboardPayload(null);
  }

  // Attach http-level error into payload.error when present
  if (!response.ok && !payload.error) {
    payload.error = `HTTP ${response.status}: Gagal memuat dashboard guru`;
  }

  return normalizeDashboardPayload(payload);
}
