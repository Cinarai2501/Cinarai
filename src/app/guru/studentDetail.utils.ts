export function toDateValue(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === 'function') {
      const converted = candidate.toDate();
      return converted instanceof Date ? converted : null;
    }
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function formatFirestoreDate(value: unknown): string {
  const parsed = toDateValue(value);
  if (!parsed) return '—';

  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLearningDuration(startAt: unknown, endAt: unknown): string {
  const start = toDateValue(startAt);
  const end = toDateValue(endAt);

  if (!start || !end) {
    return 'Belum ada data';
  }

  const diffMinutes = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} menit`;
  }

  if (diffMinutes < 1440) {
    return `${Math.round(diffMinutes / 60)} jam`;
  }

  return `${Math.round(diffMinutes / 1440)} hari`;
}

export function calculateStudentValue(
  progressDocuments: Array<{ percentage?: number }>,
  reflectionDocuments: Array<{ rating?: number | null }>
): number {
  const averageProgress = progressDocuments.length
    ? progressDocuments.reduce((sum, document) => sum + (document.percentage ?? 0), 0) / progressDocuments.length
    : 0;

  const ratings = reflectionDocuments
    .map((reflection) => reflection.rating)
    .filter((rating): rating is number => typeof rating === 'number' && Number.isFinite(rating));

  const averageReflection = ratings.length
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : null;

  if (averageReflection === null) {
    return Math.round(averageProgress);
  }

  return Math.round((averageReflection / 5) * 100 * 0.6 + averageProgress * 0.4);
}
