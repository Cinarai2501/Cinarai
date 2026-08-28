const IMAGE_VERSION_PARAMETER = 'v';

export function versionImageUrl(url: string, version?: string | number | null): string {
  if (!url || version === undefined || version === null || version === '') return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${IMAGE_VERSION_PARAMETER}=${encodeURIComponent(String(version))}`;
}

export function getTimestampVersion(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }
  if (!value || typeof value !== 'object') return null;

  const timestampValue = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
  if (typeof timestampValue.toMillis === 'function') return timestampValue.toMillis();
  if (typeof timestampValue.seconds === 'number') {
    return timestampValue.seconds * 1000 + Math.floor((timestampValue.nanoseconds ?? 0) / 1_000_000);
  }
  return null;
}