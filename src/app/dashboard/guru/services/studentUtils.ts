import type { StudentRow } from '../types';
import type { ComicProgressDocument, UserDocument } from '@/types/firestore';

export function buildStudentRow(
  user: UserDocument,
  progressList: ComicProgressDocument[]
): StudentRow {
  const avg =
    progressList.length > 0
      ? Math.round(
          progressList.reduce((s, p) => s + (p.percentage ?? 0), 0) / progressList.length
        )
      : 0;
  const completed = progressList.filter(
    (p) => p.status === 'completed' || (p.percentage ?? 0) >= 100
  ).length;
  const lastUpdated = progressList
    .map((p) => {
      const ts = p.updatedAt;
      if (!ts || typeof ts !== 'object') return null;
      return 'toDate' in ts ? (ts as { toDate: () => Date }).toDate() : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0];

  return {
    uid: user.uid,
    displayName: user.displayName?.trim() || user.email.split('@')[0],
    email: user.email,
    photoURL: user.photoURL ?? null,
    schoolName: user.schoolName ?? '—',
    gradeLevel: user.gradeLevel ?? null,
    isActive: user.isActive,
    progressList,
    averageProgress: avg,
    completedComics: completed,
    lastActivity: lastUpdated
      ? (lastUpdated as Date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Belum ada aktivitas',
  };
}

export function buildDashboardSummary(rows: StudentRow[], totalComics: number) {
  const totalStudents = rows.length;
  const progressDocuments = rows.reduce((sum, row) => sum + row.progressList.length, 0);
  const activeStudents = rows.filter((row) => row.progressList.some((progress) => progress.status === 'in_progress')).length;
  const studentsCompleted = totalComics > 0
    ? rows.filter((row) => row.completedComics >= totalComics).length
    : 0;
  const totalCompleted = rows.reduce((s, r) => s + r.completedComics, 0);
  const completionRate =
    totalStudents > 0 && totalComics > 0
      ? Math.round((totalCompleted / (totalStudents * totalComics)) * 100)
      : 0;
  const averageProgress =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.averageProgress, 0) / rows.length)
      : 0;
  return {
    totalStudents,
    totalComics,
    activeStudents,
    studentsCompleted,
    progressDocuments,
    totalCompleted,
    completionRate,
    averageProgress,
  };
}
