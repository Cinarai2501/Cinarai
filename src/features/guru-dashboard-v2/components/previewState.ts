export type GuruPreviewAccess =
  | { status: 'loading' }
  | { status: 'authorized'; uid: string }
  | { status: 'unauthenticated'; message: string }
  | { status: 'forbidden'; message: string };

export function resolveGuruPreviewAccess(input: {
  loading: boolean;
  uid: string | null;
  role: string | null;
  error: string | null;
}): GuruPreviewAccess {
  if (input.loading) return { status: 'loading' };
  if (input.error) return { status: 'unauthenticated', message: input.error };
  if (!input.uid) {
    return { status: 'unauthenticated', message: 'Silakan masuk dengan akun guru untuk membuka preview.' };
  }
  if (input.role !== 'teacher') {
    return { status: 'forbidden', message: 'Akun ini tidak memiliki akses ke Dashboard Guru.' };
  }
  return { status: 'authorized', uid: input.uid };
}

export interface StudentOwnedState {
  authUid: string | null;
  uid: string | null;
  loading: boolean;
}

export function getStudentOwnedState<T extends StudentOwnedState>(
  authUid: string | null,
  selectedUid: string | null,
  current: T,
  empty: T
): T {
  if (!authUid || !selectedUid) return empty;
  if (current.authUid === authUid && current.uid === selectedUid) return current;
  return { ...empty, authUid, uid: selectedUid, loading: true };
}
