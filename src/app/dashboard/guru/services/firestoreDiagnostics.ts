export type FirestoreFailureCategory = 'permission' | 'index' | 'network' | 'other';

export interface FirestoreOperationFailure {
  timestamp: string;
  operation: string;
  path: string;
  context: string;
  category: FirestoreFailureCategory;
  code: string;
  message: string;
  correlationId?: string;
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
  context: string,
  correlationId?: string
): FirestoreOperationFailure {
  let code = 'unknown';
  let rawMessage = 'Firestore request failed';
  try {
    if (typeof error === 'object' && error !== null) {
      const firestoreError = error as FirestoreErrorLike;
      if (typeof firestoreError.code === 'string') code = firestoreError.code;
      if (typeof firestoreError.message === 'string') rawMessage = firestoreError.message;
    }
  } catch {
    // Preserve the original Firestore failure if its error properties are unreadable.
  }
  const message = rawMessage
    .replace(/https?:\/\/\S+/gi, '[link redacted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email redacted]')
    .replace(/\b[A-Za-z0-9_-]{20,}\b/g, '[id redacted]')
    .slice(0, 300);

  return {
    timestamp: new Date().toISOString(),
    operation,
    path,
    context,
    category: classifyFirestoreFailure(code, rawMessage),
    code,
    message,
    ...(correlationId ? { correlationId } : {}),
  };
}

export function logFirestoreOperationFailure(failure: FirestoreOperationFailure): void {
  const safeDiagnostic = {
    timestamp: failure.timestamp,
    operation: failure.operation,
    path: failure.path,
    context: failure.context,
    code: failure.code,
    category: failure.category,
    ...(failure.correlationId ? { correlationId: failure.correlationId } : {}),
  };
  try {
    console.error('[GuruDashboardFirestore]', safeDiagnostic);
  } catch {
    // Logging must not replace the Firestore failure being reported.
  }
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
