import { adminAuth, adminFirestore } from '@/lib/firebase/admin';
import {
  resolveAiRequestAccess,
  type AiRequestAccessResult,
} from './requestAccess';
import { consumeAiUserRateLimit } from './userRateLimit';

export async function getAiRequestAccess(
  request: Request,
  allowedRoles: readonly string[] = ['student'],
): Promise<AiRequestAccessResult> {
  if (!adminAuth || !adminFirestore) {
    return { ok: false, status: 503, error: 'Layanan autentikasi sedang tidak tersedia.' };
  }

  return resolveAiRequestAccess(request.headers.get('authorization'), allowedRoles, {
    verifyIdToken: async (token) => adminAuth!.verifyIdToken(token, true),
    getRole: async (uid) => {
      const profile = await adminFirestore!.collection('users').doc(uid).get();
      const profileData = profile.data();
      if (profileData?.isActive === false) return null;
      return profileData?.role;
    },
  });
}

export async function checkAuthenticatedAiRateLimit(
  uid: string,
): Promise<
  | { ok: true }
  | { ok: false; status: 429 | 503; error: string; retryAfterSeconds?: number }
> {
  try {
    if (!adminFirestore) throw new Error('Firebase Admin Firestore is unavailable.');
    const retryAfterSeconds = await consumeAiUserRateLimit(adminFirestore, uid);
    if (retryAfterSeconds === 0) return { ok: true };
    return {
      ok: false,
      status: 429,
      error: `Batas permintaan AI internal tercapai. Coba lagi dalam ${retryAfterSeconds} detik.`,
      retryAfterSeconds,
    };
  } catch {
    return { ok: false, status: 503, error: 'Pembatasan penggunaan AI sedang tidak tersedia.' };
  }
}
