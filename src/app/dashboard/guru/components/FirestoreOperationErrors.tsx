'use client';

import { getFirestoreFailureLabel, type FirestoreOperationFailure } from '../services/firestoreDiagnostics';

export function FirestoreOperationErrors({
  failures,
  onRetry,
}: {
  failures: FirestoreOperationFailure[];
  onRetry: () => void;
}) {
  if (failures.length === 0) return null;

  return (
    <div role="alert" className="rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
      <p className="font-semibold">Sebagian data belum dapat dimuat.</p>
      <ul className="mt-2 space-y-1">
        {failures.map((failure, index) => (
          <li key={`${failure.operation}:${failure.path}:${index}`}>
            {failure.operation} ({failure.path}): {getFirestoreFailureLabel(failure.category)} [{failure.code}]
            {failure.message ? ` — ${failure.message}` : ''}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-white px-3 py-1.5 font-semibold text-error-700 shadow-sm">
        Coba lagi
      </button>
    </div>
  );
}
