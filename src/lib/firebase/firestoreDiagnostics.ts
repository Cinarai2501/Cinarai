export interface FirestoreQueryDiagnostic {
  sdk: 'admin' | 'client';
  operation: string;
  collection: string;
  queryScope: 'COLLECTION' | 'COLLECTION_GROUP';
  where?: Array<{ field: string; operator: string }>;
  orderBy?: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
}

export function logFirestoreQueryFailure(
  context: FirestoreQueryDiagnostic,
  error: unknown,
): void {
  const errorCode = error && typeof error === 'object' && 'code' in error
    ? String(error.code)
    : 'unknown';

  console.error('[firestore-query-failed]', { ...context, errorCode });
}

export async function runFirestoreQuery<T>(
  context: FirestoreQueryDiagnostic,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logFirestoreQueryFailure(context, error);
    throw error;
  }
}
