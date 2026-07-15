import type {
  ActivityDocument,
  ComicDocument,
  ComicProgressDocument,
  ReflectionDocument,
  UserDocument,
} from '@/types/firestore';

async function fetchDashboardData() {
  const token = await (await import('@/lib/firebase/auth')).getUserToken();
  if (!token) {
    throw new Error('Sesi guru tidak tersedia.');
  }

  const response = await fetch('/api/dashboard/guru', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? 'Dashboard guru gagal dimuat');
  }

  return response.json();
}

export async function loadAllUsers(): Promise<UserDocument[]> {
  const payload = await fetchDashboardData();
  return payload.students ?? [];
}

export function subscribeToUsers(
  callback: (users: UserDocument[]) => void,
  onError?: (error: Error) => void
) {
  let timer: ReturnType<typeof setInterval> | undefined;

  const refresh = async () => {
    try {
      const payload = await fetchDashboardData();
      callback(payload.students ?? []);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load users'));
    }
  };

  void refresh();
  timer = setInterval(() => {
    void refresh();
  }, 10000);

  return () => {
    if (timer) clearInterval(timer);
  };
}

export async function loadAllComics(): Promise<ComicDocument[]> {
  const payload = await fetchDashboardData();
  return payload.comics ?? [];
}

export function subscribeToComics(
  callback: (comics: ComicDocument[]) => void,
  onError?: (error: Error) => void
) {
  let timer: ReturnType<typeof setInterval> | undefined;

  const refresh = async () => {
    try {
      const payload = await fetchDashboardData();
      callback(payload.comics ?? []);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load comics'));
    }
  };

  void refresh();
  timer = setInterval(() => {
    void refresh();
  }, 10000);

  return () => {
    if (timer) clearInterval(timer);
  };
}

export async function loadRecentActivities(limitCount = 20): Promise<ActivityDocument[]> {
  const payload = await fetchDashboardData();
  return (payload.activities ?? []).slice(0, limitCount);
}

export function subscribeToRecentActivities(
  callback: (activities: ActivityDocument[]) => void,
  onError?: (error: Error) => void
) {
  let timer: ReturnType<typeof setInterval> | undefined;

  const refresh = async () => {
    try {
      const payload = await fetchDashboardData();
      callback((payload.activities ?? []).slice(0, 20));
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load activities'));
    }
  };

  void refresh();
  timer = setInterval(() => {
    void refresh();
  }, 10000);

  return () => {
    if (timer) clearInterval(timer);
  };
}

export async function loadAllReflections(): Promise<ReflectionDocument[]> {
  const payload = await fetchDashboardData();
  return (payload.reflections ?? []).slice(0, 200);
}

export function subscribeToReflections(
  callback: (reflections: ReflectionDocument[]) => void,
  onError?: (error: Error) => void
) {
  let timer: ReturnType<typeof setInterval> | undefined;

  const refresh = async () => {
    try {
      const payload = await fetchDashboardData();
      callback((payload.reflections ?? []).slice(0, 200));
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load reflections'));
    }
  };

  void refresh();
  timer = setInterval(() => {
    void refresh();
  }, 10000);

  return () => {
    if (timer) clearInterval(timer);
  };
}

export async function loadAllProgressDocuments(): Promise<ComicProgressDocument[]> {
  const payload = await fetchDashboardData();
  return payload.progressDocuments ?? [];
}

export function subscribeToAllProgressDocuments(
  callback: (progressDocuments: ComicProgressDocument[]) => void,
  onError?: (error: Error) => void
) {
  let timer: ReturnType<typeof setInterval> | undefined;

  const refresh = async () => {
    try {
      const payload = await fetchDashboardData();
      callback(payload.progressDocuments ?? []);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to load progress'));
    }
  };

  void refresh();
  timer = setInterval(() => {
    void refresh();
  }, 10000);

  return () => {
    if (timer) clearInterval(timer);
  };
}
