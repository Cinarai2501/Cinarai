import type { ActivityDocument, ComicDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import { SINTAKS } from '@/types/progress';

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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function getEffectiveProgressPercentage(document: ComicProgressDocument): number {
  if (typeof document.percentage === 'number' && Number.isFinite(document.percentage)) {
    return Math.min(100, Math.max(0, document.percentage));
  }

  const completedStages = isStringArray(
    (document as unknown as { completedStages?: unknown }).completedStages
  )
    ? (document as unknown as { completedStages: string[] }).completedStages
    : undefined;
  if (Array.isArray(completedStages)) {
    return Math.round((completedStages.length / SINTAKS.length) * 100);
  }

  if (Array.isArray(document.sintaksList)) {
    const completedCount = document.sintaksList.filter((item) => item.status === 'COMPLETED').length;
    return Math.round((completedCount / SINTAKS.length) * 100);
  }

  return 0;
}

function isCompletedModuleProgress(document: ComicProgressDocument): boolean {
  if (document.status === 'completed') return true;
  if (typeof document.percentage === 'number' && document.percentage >= 100) return true;

  const completedStages = isStringArray(
    (document as unknown as { completedStages?: unknown }).completedStages
  )
    ? (document as unknown as { completedStages: string[] }).completedStages
    : undefined;
  if (Array.isArray(completedStages) && completedStages.length >= SINTAKS.length) return true;

  if (Array.isArray(document.sintaksList) && document.sintaksList.length >= SINTAKS.length && document.sintaksList.every((item) => item.status === 'COMPLETED')) {
    return true;
  }

  return false;
}

function isInProgressModuleProgress(document: ComicProgressDocument): boolean {
  if (document.status === 'in_progress') return true;
  const percentage = getEffectiveProgressPercentage(document);
  return percentage > 0 && percentage < 100;
}

export function buildGuruDashboardSnapshot(input: {
  students?: UserDocument[];
  comics?: ComicDocument[];
  progressDocuments?: ComicProgressDocument[];
  activities?: ActivityDocument[];
  reflections?: ReflectionDocument[];
}): GuruDashboardSnapshot {
  const students = input.students ?? [];
  const comics = input.comics ?? [];
  const progressDocuments = input.progressDocuments ?? [];
  const activities = input.activities ?? [];
  const reflections = input.reflections ?? [];

  const totalStudents = students.length;
  const progressStudentIds = new Set<string>(
    progressDocuments
      .map((document) => document.userId)
      .filter((userId): userId is string => typeof userId === 'string' && userId.length > 0)
  );
  const activityStudentIds = new Set<string>(
    activities
      .map((activity) => activity.userId)
      .filter((userId): userId is string => typeof userId === 'string' && userId.length > 0)
  );
  const activeStudents = students.filter((student) => progressStudentIds.has(student.uid) || activityStudentIds.has(student.uid)).length;

  const moduleComicIds = new Set<number>(comics.map((comic) => comic.comicId));
  progressDocuments.forEach((document) => {
    if (typeof document.comicId === 'number') {
      moduleComicIds.add(document.comicId);
    }
  });
  const totalModules = moduleComicIds.size;
  const averageProgress = progressDocuments.length
    ? Math.round(progressDocuments.reduce((sum, document) => sum + getEffectiveProgressPercentage(document), 0) / progressDocuments.length)
    : 0;

  const completedModules = progressDocuments.filter(isCompletedModuleProgress).length;
  const completedModulesRate = progressDocuments.length ? Math.round((completedModules / progressDocuments.length) * 100) : 0;
  const activeStudentRate = totalStudents ? Math.round((activeStudents / totalStudents) * 100) : 0;

  if (process.env.NODE_ENV === 'development') {
    /* eslint-disable no-console */
    console.group('[GuruDashboardSnapshot]');
    console.log('students:', students.length);
    console.log('progress docs:', progressDocuments.length);
    console.log('completed modules:', completedModules);
    console.log('average progress:', averageProgress);
    console.log('summary:', {
      totalStudents,
      activeStudents,
      totalModules,
      averageProgress,
      completedModules,
      completedModulesRate,
      activeStudentRate,
    });
    console.groupEnd();
    /* eslint-enable no-console */
  }

  const fallbackModules = Array.from(moduleComicIds)
    .filter((comicId) => !comics.some((comic) => comic.comicId === comicId))
    .map((comicId) => ({
      comicId,
      slug: `module-${comicId}`,
      title: `Modul #${comicId}`,
      subtitle: '',
      kelas: '',
      lokasi: '',
      synopsis: 'Modul ini belum memiliki metadata di koleksi comics.',
      characters: [],
      learningTargets: [],
      estimatedMinutes: 0,
      pdfUrl: null,
      coverUrl: '',
      thumbnailUrl: '',
      order: 0,
      availability: 'ACTIVE' as const,
    }));

  const modules = [...comics, ...fallbackModules].map((comic) => {
    const moduleProgressDocuments = progressDocuments.filter((document) => document.comicId === comic.comicId);
    const completedCount = moduleProgressDocuments.filter(isCompletedModuleProgress).length;
    const inProgressCount = moduleProgressDocuments.filter(isInProgressModuleProgress).length;
    const progress = moduleProgressDocuments.length
      ? Math.round(moduleProgressDocuments.reduce((sum, document) => sum + getEffectiveProgressPercentage(document), 0) / moduleProgressDocuments.length)
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

  const progressItems = progressDocuments.length
    ? [
        { label: 'Progress Kelas', value: averageProgress },
        { label: 'Modul Selesai', value: completedModulesRate },
        { label: 'Siswa Aktif', value: activeStudentRate },
      ]
    : [];

  const studentIds = new Set(students.map((student) => student.uid));
  const recentActivities = activities
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

  void reflections;

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
