export interface TeacherReportRow {
  studentId: string;
  studentName: string;
  studentEmail: string;
  comicId: number;
  comicTitle: string;
  progress: number;
  value: number;
  status: string;
  updatedAt?: unknown;
}

export interface TeacherReportFilters {
  comicId?: number | null;
  studentId?: string | null;
  date?: string | null;
}

export interface TeacherReportSummary {
  totalStudents: number;
  totalComics: number;
  averageProgress: number;
  averageValue: number;
  completedCount: number;
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === 'function') {
      const converted = candidate.toDate();
      return converted instanceof Date ? converted.toISOString().slice(0, 10) : null;
    }
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  }

  return null;
}

export function filterReportRows(rows: TeacherReportRow[], filters: TeacherReportFilters): TeacherReportRow[] {
  return rows.filter((row) => {
    const matchesComic = !filters.comicId || row.comicId === filters.comicId;
    const matchesStudent = !filters.studentId || row.studentId === filters.studentId;
    const matchesDate = !filters.date || normalizeDate(row.updatedAt) === filters.date;
    return matchesComic && matchesStudent && matchesDate;
  });
}

export function summarizeReportRows(rows: TeacherReportRow[]): TeacherReportSummary {
  if (!rows.length) {
    return {
      totalStudents: 0,
      totalComics: 0,
      averageProgress: 0,
      averageValue: 0,
      completedCount: 0,
    };
  }

  const uniqueStudents = new Set(rows.map((row) => row.studentId)).size;
  const uniqueComics = new Set(rows.map((row) => row.comicId)).size;
  const averageProgress = Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length);
  const averageValue = Math.round(rows.reduce((sum, row) => sum + row.value, 0) / rows.length);
  const completedCount = rows.filter((row) => row.status === 'completed').length;

  return {
    totalStudents: uniqueStudents,
    totalComics: uniqueComics,
    averageProgress,
    averageValue,
    completedCount,
  };
}

export function formatReportDate(value: unknown): string {
  const normalized = normalizeDate(value);
  if (!normalized) return '—';
  return normalized;
}

export function escapeCsvValue(value: unknown): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
