import type { ActivityDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import { SINTAKS } from '@/types/progress';

export interface ClassroomSummary {
  totalStudents: number;
  totalGuru: number;
  activeStudents: number;
  studentsWithAnyCompletedComic: number;
  studentsCompletedAllComics: number;
}

export interface ComicProgressSummary {
  comicId: number;
  label: string;
  percentage: number;
}

export interface StageProgressSummary {
  stage: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export interface ValueBucketSummary {
  label: string;
  count: number;
}

export interface CompletionStatusSummary {
  label: string;
  count: number;
  description: string;
}

export interface RecentActivitySummary {
  id: string;
  studentName: string;
  title: string;
  description?: string;
  occurredAt: unknown;
}

export const guruDashboardStats = [
  { title: 'Siswa Aktif', value: '128', icon: 'people' as const, accent: 'bg-primary-50 text-primary-700' },
  { title: 'Kelas Dibimbing', value: '12', icon: 'school' as const, accent: 'bg-secondary-50 text-secondary-700' },
  { title: 'Modul Tersedia', value: '24', icon: 'menuBook' as const, accent: 'bg-amber-50 text-amber-700' },
  { title: 'Pencapaian Rata-rata', value: '87%', icon: 'trendingUp' as const, accent: 'bg-emerald-50 text-emerald-700' },
];

export const guruProgressItems = [
  { label: 'Komik Interaktif', value: 88 },
  { label: 'Latihan Identifikasi', value: 74 },
  { label: 'Refleksi Siswa', value: 64 },
];

export const guruModules = [
  {
    title: 'Pengenalan Karakter',
    description: 'Membantu siswa mengenali tokoh utama melalui narasi dan visual.',
    completed: 92,
    progress: 82,
    badge: 'Baru',
  },
  {
    title: 'Analisis Alur',
    description: 'Melatih siswa memahami urutan kejadian dan penyebabnya.',
    completed: 58,
    progress: 71,
    badge: 'Populer',
  },
];

export const guruActivities = [
  {
    title: 'Kelas 7A menyelesaikan modul 2',
    detail: 'Siswa berhasil menyelesaikan 18 dari 20 latihan.',
    time: '10 menit lalu',
  },
  {
    title: 'Review observasi diterima',
    detail: 'Ada 3 tugas yang perlu ditindaklanjuti.',
    time: '1 jam lalu',
  },
  {
    title: 'Pembaruan materi dibagikan',
    detail: 'Materi baru tersedia untuk semua kelas.',
    time: '2 jam lalu',
  },
];

export function buildClassroomSummary(
  users: UserDocument[],
  progressByStudent: Map<string, ComicProgressDocument[]>,
  totalComics: number
): ClassroomSummary {
  const students = users.filter((user) => user.role === 'student');
  const teachers = users.filter((user) => user.role === 'teacher');

  const activeStudents = students.filter((student) => student.isActive).length;
  const studentsWithAnyCompletedComic = Array.from(progressByStudent.entries()).filter(([, documents]) => {
    return documents.some((document) => document.status === 'completed' || (document.percentage ?? 0) >= 100);
  }).length;

  const studentsCompletedAllComics = Array.from(progressByStudent.entries()).filter(([, documents]) => {
    if (totalComics <= 0) return false;
    const completedComics = documents.filter((document) => document.status === 'completed' || (document.percentage ?? 0) >= 100);
    return completedComics.length >= totalComics;
  }).length;

  return {
    totalStudents: students.length,
    totalGuru: teachers.length,
    activeStudents,
    studentsWithAnyCompletedComic,
    studentsCompletedAllComics,
  };
}

export function buildComicProgressSummary(
  progressByStudent: Map<string, ComicProgressDocument[]>,
  comicIds: number[]
): ComicProgressSummary[] {
  return comicIds.map((comicId) => {
    const progressValues = Array.from(progressByStudent.values()).flatMap((documents) => {
      return documents.filter((document) => document.comicId === comicId).map((document) => document.percentage ?? 0);
    });

    const averageProgress = progressValues.length
      ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
      : 0;

    return {
      comicId,
      label: `Komik ${comicId}`,
      percentage: averageProgress,
    };
  });
}

export function buildStageProgressSummary(
  progressByStudent: Map<string, ComicProgressDocument[]>
): StageProgressSummary[] {
  const stages = SINTAKS.filter((stage) => stage !== 'Cover');
  const totalProgressDocuments = Array.from(progressByStudent.values()).reduce(
    (sum, documents) => sum + documents.length,
    0
  );

  if (!totalProgressDocuments) {
    return stages.map((stage) => ({ stage, completedCount: 0, totalCount: 0, percentage: 0 }));
  }

  return stages.map((stage) => {
    const completedCount = Array.from(progressByStudent.values()).reduce((sum, documents) => {
      return sum + documents.filter((document) => {
        return (document.sintaksList ?? []).some((item) => item.sintaks === stage && item.status === 'COMPLETED');
      }).length;
    }, 0);

    return {
      stage,
      completedCount,
      totalCount: totalProgressDocuments,
      percentage: Math.round((completedCount / totalProgressDocuments) * 100),
    };
  });
}

export function buildValueDistribution(
  users: UserDocument[],
  progressByStudent: Map<string, ComicProgressDocument[]>,
  reflectionsByStudent: Map<string, ReflectionDocument[]>
): ValueBucketSummary[] {
  const buckets = [
    { label: '90–100', min: 90, max: 100 },
    { label: '80–89', min: 80, max: 89 },
    { label: '70–79', min: 70, max: 79 },
    { label: '60–69', min: 60, max: 69 },
    { label: '<60', min: 0, max: 59 },
  ];

  const studentIds = users.filter((user) => user.role === 'student').map((user) => user.uid);
  const values = studentIds.map((studentId) => {
    const progressDocuments = progressByStudent.get(studentId) ?? [];
    const reflections = reflectionsByStudent.get(studentId) ?? [];
    if (!progressDocuments.length && !reflections.length) {
      return 0;
    }

    const averageProgress = progressDocuments.length
      ? progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / progressDocuments.length
      : 0;

    const ratings = reflections
      .map((reflection) => reflection.rating)
      .filter((rating): rating is number => typeof rating === 'number' && Number.isFinite(rating));

    const averageReflection = ratings.length
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null;

    if (averageReflection === null) {
      return Math.round(averageProgress);
    }

    return Math.round((averageReflection / 5) * 100 * 0.6 + averageProgress * 0.4);
  });

  return buckets.map((bucket) => ({
    label: bucket.label,
    count: values.filter((value) => value >= bucket.min && value <= bucket.max).length,
  }));
}

export function buildCompletionStatusSummary(
  progressByStudent: Map<string, ComicProgressDocument[]>
): CompletionStatusSummary[] {
  const statuses = [
    {
      label: 'Belum memulai',
      description: 'Belum ada progress',
      matcher: (documents: ComicProgressDocument[]) => !documents.length || documents.every((document) => (document.percentage ?? 0) === 0),
    },
    {
      label: 'Sedang belajar',
      description: 'Sudah ada progress tetapi belum selesai',
      matcher: (documents: ComicProgressDocument[]) => documents.some((document) => (document.percentage ?? 0) > 0 && (document.percentage ?? 0) < 100 && document.status !== 'completed'),
    },
    {
      label: 'Sudah selesai',
      description: 'Minimal satu komik selesai',
      matcher: (documents: ComicProgressDocument[]) => documents.some((document) => document.status === 'completed' || (document.percentage ?? 0) >= 100),
    },
  ];

  return statuses.map((status) => ({
    label: status.label,
    description: status.description,
    count: Array.from(progressByStudent.values()).filter((documents) => status.matcher(documents)).length,
  }));
}

export function buildRecentActivities(
  activities: ActivityDocument[],
  usersById: Map<string, UserDocument>
): RecentActivitySummary[] {
  return activities
    .slice()
    .sort((left, right) => {
      const leftTime = left.occurredAt instanceof Date ? left.occurredAt.getTime() : 0;
      const rightTime = right.occurredAt instanceof Date ? right.occurredAt.getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 10)
    .map((activity) => ({
      id: activity.id ?? `${activity.userId}-${activity.title}`,
      studentName: usersById.get(activity.userId)?.displayName?.trim() || usersById.get(activity.userId)?.email?.split('@')[0] || 'Siswa',
      title: activity.title,
      description: activity.description,
      occurredAt: activity.occurredAt,
    }));
}
