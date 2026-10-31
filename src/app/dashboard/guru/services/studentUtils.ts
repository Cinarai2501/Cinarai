import type { StudentLearningStatus, StudentRow, StudentStatusFilter } from '../types';
import type { ComicProgressDocument, UserDocument } from '@/types/firestore';
import { getModuleStudentStatus, isModuleProgressComplete } from './progressStatus';

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
  const completedComicIds = new Set(progressList
    .filter(isModuleProgressComplete)
    .map((progress) => progress.comicId));
  const lastUpdated = progressList
    .map((p) => {
      const ts = p.updatedAt;
      if (!ts || typeof ts !== 'object') return null;
      return 'toDate' in ts ? (ts as { toDate: () => Date }).toDate() : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0];
  const uid = user.uid?.trim() || user.id?.trim() || '';

  return {
    uid,
    displayName: user.displayName?.trim() || user.email?.split('@')[0] || `Siswa ${uid.slice(0, 6)}`,
    email: user.email?.trim() || 'Email tidak tersedia',
    photoURL: user.photoURL ?? null,
    schoolName: user.schoolName ?? '—',
    classLevel: user.classLevel ?? null,
    gradeLevel: user.gradeLevel ?? null,
    isActive: user.isActive,
    progressList,
    averageProgress: avg,
    completedComics: completedComicIds.size,
    lastActivity: lastUpdated
      ? (lastUpdated as Date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'Belum ada aktivitas',
  };
}

export function getStudentLearningStatus(
  student: StudentRow,
  totalComics: number
): StudentLearningStatus {
  const completedComicIds = new Set(student.progressList
    .filter(isModuleProgressComplete)
    .map((progress) => progress.comicId));
  if (totalComics > 0 && completedComicIds.size >= totalComics) return 'completed';

  const hasLearningEvidence = student.progressList.some(
    (progress) => getModuleStudentStatus(progress) !== 'not_started'
  );
  if (!hasLearningEvidence) return 'not_started';
  if (student.averageProgress < 40) return 'attention';
  return 'learning';
}

export function matchesStudentStatus(
  student: StudentRow,
  filter: StudentStatusFilter,
  totalComics: number
): boolean {
  if (filter === 'all') return true;
  const status = getStudentLearningStatus(student, totalComics);
  return filter === 'completed'
    ? status === 'completed'
    : filter === 'learning'
      ? status === 'learning'
      : filter === 'attention'
        ? status === 'attention'
        : status === 'not_started';
}

export function filterAndSortStudents(
  rows: StudentRow[],
  options: {
    search: string;
    status: StudentStatusFilter;
    sortKey: 'name' | 'progress' | 'completed';
    sortDir: 'asc' | 'desc';
    totalComics: number;
  }
): StudentRow[] {
  const q = options.search.trim().toLocaleLowerCase('id');
  return rows
    .filter((student) => {
      if (!matchesStudentStatus(student, options.status, options.totalComics)) return false;
      if (!q) return true;
      const searchableValues = [
        student.displayName,
        student.email,
        student.schoolName,
        student.classLevel ?? '',
        student.gradeLevel === null ? '' : `kelas ${student.gradeLevel}`,
      ];
      return searchableValues.some((value) => value.toLocaleLowerCase('id').includes(q));
    })
    .sort((left, right) => {
      const comparison = options.sortKey === 'name'
        ? left.displayName.localeCompare(right.displayName, 'id', { sensitivity: 'base' })
        : options.sortKey === 'progress'
          ? left.averageProgress - right.averageProgress
          : left.completedComics - right.completedComics;
      if (comparison !== 0) return options.sortDir === 'asc' ? comparison : -comparison;
      return left.uid.localeCompare(right.uid);
    });
}

export function buildDashboardSummary(rows: StudentRow[], totalComics: number) {
  const totalStudents = rows.length;
  const progressDocuments = rows.reduce((sum, row) => sum + row.progressList.length, 0);
  const statuses = rows.map((row) => getStudentLearningStatus(row, totalComics));
  const activeStudents = statuses.filter((status) => status === 'learning' || status === 'attention').length;
  const attentionStudents = statuses.filter((status) => status === 'attention').length;
  const notStartedStudents = statuses.filter((status) => status === 'not_started').length;
  const studentsCompleted = totalComics > 0
    ? statuses.filter((status) => status === 'completed').length
    : 0;
  const totalCompleted = rows.reduce((sum, row) => {
    const completedComicIds = new Set(row.progressList
      .filter(isModuleProgressComplete)
      .map((progress) => progress.comicId));
    return sum + completedComicIds.size;
  }, 0);
  const completionRate =
    totalStudents > 0 && totalComics > 0
      ? Math.min(100, Math.round((totalCompleted / (totalStudents * totalComics)) * 100))
      : 0;
  const rowsWithProgress = rows.filter((row) => row.progressList.length > 0);
  const averageProgress =
    rowsWithProgress.length > 0
      ? Math.round(rowsWithProgress.reduce((sum, row) => sum + row.averageProgress, 0) / rowsWithProgress.length)
      : 0;
  return {
    totalStudents,
    totalComics,
    activeStudents,
    attentionStudents,
    notStartedStudents,
    studentsCompleted,
    progressDocuments,
    totalCompleted,
    completionRate,
    averageProgress,
  };
}
