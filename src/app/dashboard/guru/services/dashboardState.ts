export type DashboardErrorKind = 'firestore_error' | 'authentication_error' | 'api_error';
export type DashboardDataState =
  | 'loading'
  | 'empty'
  | 'available'
  | 'insufficient_data'
  | DashboardErrorKind;

export interface DashboardRequestError {
  kind: DashboardErrorKind;
  message: string;
}

export interface DashboardRequestState {
  loading: boolean;
  recentActivityLoading: boolean;
  error: string | null;
  errorKind: DashboardErrorKind | null;
  dataState: DashboardDataState;
  hasLoaded: boolean;
}

export class DashboardFirestoreQueryError extends Error {
  constructor() {
    super('Dashboard Firestore query failed.');
    this.name = 'DashboardFirestoreQueryError';
  }
}

export function getDashboardServerFailure(error: unknown): {
  status: number;
  kind: DashboardErrorKind;
  message: string;
} {
  if (error instanceof DashboardFirestoreQueryError) {
    return {
      status: 503,
      kind: 'firestore_error',
      message: 'Data dashboard belum dapat diambil dari Firestore. Silakan coba lagi.',
    };
  }
  return {
    status: 500,
    kind: 'api_error',
    message: 'Dashboard gagal memuat data. Silakan coba lagi.',
  };
}

export function getDashboardResponseError(
  status: number,
  payload: { code?: unknown; error?: unknown },
): DashboardRequestError {
  const kind: DashboardErrorKind = status === 401 || status === 403 || payload.code === 'authentication_error'
    ? 'authentication_error'
    : status === 503 && payload.code === 'firestore_error'
      ? 'firestore_error'
      : 'api_error';
  const message = typeof payload.error === 'string' && payload.error.trim()
    ? payload.error
    : kind === 'authentication_error'
      ? 'Sesi guru tidak valid. Silakan masuk kembali.'
      : kind === 'firestore_error'
        ? 'Data dashboard belum dapat diambil dari Firestore. Silakan coba lagi.'
        : 'Dashboard gagal memuat data. Silakan coba lagi.';
  return { kind, message };
}

export function getDashboardDataState(
  studentCount: number,
  progressCount: number,
): Exclude<DashboardDataState, 'loading' | DashboardErrorKind> {
  if (studentCount === 0) return 'empty';
  return progressCount === 0 ? 'insufficient_data' : 'available';
}

export function failDashboardRequest<T extends DashboardRequestState>(
  state: T,
  error: DashboardRequestError,
): T {
  return {
    ...state,
    loading: false,
    recentActivityLoading: false,
    error: error.message,
    errorKind: error.kind,
    dataState: error.kind,
  };
}

export function completeDashboardRequest<T extends DashboardRequestState>(
  state: T,
  dataState: Exclude<DashboardDataState, 'loading' | DashboardErrorKind>,
): T {
  return {
    ...state,
    loading: false,
    recentActivityLoading: false,
    error: null,
    errorKind: null,
    dataState,
    hasLoaded: true,
  };
}
