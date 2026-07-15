import type { ActivityDocument, ComicDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';

export type GuruDashboardSnapshot = {
  summary: {
    totalStudents: number;
    activeStudents: number;
    totalModules: number;
    averageProgress: number;
  };
  progressItems: Array<{ label: string; value: number }>;
  modules: Array<{
    moduleId: number;
    title: string;
    description: string;
    completed: number;
    inProgress: number;
    progress: number;
    badge: string;
    coverLabel: string;
  }>;
  recentActivities: Array<{
    id: string;
    title: string;
    detail: string;
    time: string;
  }>;
};

function toRelativeTimeLabel(date: Date): string {
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds} detik lalu`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function coerceDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

export function buildGuruDashboardSnapshot(input: {
  students: UserDocument[];
  comics: ComicDocument[];
  progressDocuments: ComicProgressDocument[];
  activities: ActivityDocument[];
  reflections: ReflectionDocument[];
}): GuruDashboardSnapshot {
  const progressDocuments = input.progressDocuments ?? [];
  const progressByStudent = new Map<string, ComicProgressDocument[]>();
  progressDocuments.forEach((document) => {
    const userId = document.userId ?? '';
    if (!userId) return;
    const existing = progressByStudent.get(userId) ?? [];
    existing.push(document);
    progressByStudent.set(userId, existing);
  });

  const totalStudents = input.students.length;
  const activeStudents = input.students.filter((student) => student.isActive).length;
  const totalModules = input.comics.length;
  const averageProgress = progressDocuments.length
    ? Math.round(progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / progressDocuments.length)
    : 0;

  const completedModules = progressDocuments.filter((document) => document.status === 'completed' || (document.percentage ?? 0) >= 100).length;
  const completedModulesRate = progressDocuments.length ? Math.round((completedModules / progressDocuments.length) * 100) : 0;
  const activeStudentRate = totalStudents ? Math.round((activeStudents / totalStudents) * 100) : 0;

  const modules = input.comics.map((comic) => {
    const moduleProgressDocuments = progressDocuments.filter((document) => document.comicId === comic.comicId);
    const completedCount = moduleProgressDocuments.filter((document) => document.status === 'completed' || (document.percentage ?? 0) >= 100).length;
    const inProgressCount = moduleProgressDocuments.filter((document) => document.status === 'in_progress' || ((document.percentage ?? 0) > 0 && (document.percentage ?? 0) < 100)).length;
    const progress = moduleProgressDocuments.length
      ? Math.round(moduleProgressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / moduleProgressDocuments.length)
      : 0;

    const badge = completedCount >= 5 ? 'Populer' : inProgressCount > 0 ? 'Sedang' : 'Baru';

    return {
      moduleId: comic.comicId,
      title: comic.title,
      description: comic.subtitle || comic.synopsis || 'Pelajari konsep berharga dalam modul ini.',
      completed: completedCount,
      inProgress: inProgressCount,
      progress,
      badge,
      coverLabel: comic.title.split(' ')[0] ?? 'Modul',
    };
  });

  const progressItems = [
    { label: 'Progress Kelas', value: averageProgress },
    { label: 'Modul Selesai', value: completedModulesRate },
    { label: 'Siswa Aktif', value: activeStudentRate },
  ];

  const studentIds = new Set(input.students.map((student) => student.uid));
  const recentActivities = input.activities
    .filter((activity) => studentIds.has(activity.userId))
    .slice()
    .sort((left, right) => {
      const leftTime = coerceDate(left.occurredAt)?.getTime() ?? 0;
      const rightTime = coerceDate(right.occurredAt)?.getTime() ?? 0;
      return rightTime - leftTime;
    })
    .slice(0, 5)
    .map((activity) => {
      const occurredAt = coerceDate(activity.occurredAt) ?? new Date();
      return {
        id: activity.id ?? `${activity.userId}-${activity.type}`,
        title: activity.title || (activity.type === 'comic_completed' ? 'Siswa menyelesaikan komik' : activity.type === 'reflection_submitted' ? 'Siswa menyelesaikan refleksi' : activity.type === 'lesson_completed' ? 'Siswa menyelesaikan pelajaran' : 'Aktivitas terbaru siswa'),
        detail: activity.description ?? 'Perkembangan terbaru siswa telah tercatat.',
        time: toRelativeTimeLabel(occurredAt),
      };
    });

  return {
    summary: {
      totalStudents,
      activeStudents,
      totalModules,
      averageProgress,
    },
    progressItems,
    modules,
    recentActivities,
  };
}
