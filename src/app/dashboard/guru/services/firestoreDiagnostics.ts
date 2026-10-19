export type FirestoreFailureCategory = 'permission' | 'index' | 'network' | 'other';

export interface FirestoreOperationFailure {
  operation: string;
  path: string;
  context: string;
  category: FirestoreFailureCategory;
  code: string;
  message: string;
}

interface FirestoreErrorLike {
  code?: unknown;
  message?: unknown;
}

export function classifyFirestoreFailure(code: string, message: string): FirestoreFailureCategory {
  if (code === 'permission-denied' || code === 'unauthenticated') return 'permission';
  if (code === 'failed-precondition' && /index/i.test(message)) return 'index';
  if (['unavailable', 'deadline-exceeded', 'network-request-failed', 'cancelled'].includes(code)) {
    return 'network';
  }
  return 'other';
}

export function createFirestoreOperationFailure(
  error: unknown,
  operation: string,
  path: string,
  context: string
): FirestoreOperationFailure {
  const firestoreError = error as FirestoreErrorLike | null;
  const code = typeof firestoreError?.code === 'string' ? firestoreError.code : 'unknown';
  const rawMessage = typeof firestoreError?.message === 'string'
    ? firestoreError.message
    : 'Firestore request failed';
  const message = rawMessage
    .replace(/https?:\/\/\S+/gi, '[link redacted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email redacted]')
    .replace(/\b[A-Za-z0-9_-]{20,}\b/g, '[id redacted]')
    .slice(0, 300);

  return {
    operation,
    path,
    context,
    category: classifyFirestoreFailure(code, rawMessage),
    code,
    message,
  };
}

export function logFirestoreOperationFailure(failure: FirestoreOperationFailure): void {
  console.error('[GuruDashboardFirestore]', failure);
}

export function getFirestoreFailureLabel(category: FirestoreFailureCategory): string {
  switch (category) {
    case 'permission':
      return 'Akses Firestore ditolak';
    case 'index':
      return 'Indeks Firestore diperlukan';
    case 'network':
      return 'Koneksi Firestore gagal';
    case 'other':
      return 'Operasi Firestore gagal';
  }
}
