export function getStudentRecordOwner(
  data: unknown,
  allowedUids?: ReadonlySet<string>,
): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  const record = data as Record<string, unknown>;
  const ownerUids = ['userId', 'studentId']
    .map((field) => record[field])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim());
  const uniqueOwnerUids = Array.from(new Set(ownerUids));
  if (uniqueOwnerUids.length !== 1) return null;

  const [uid] = uniqueOwnerUids;
  return !allowedUids || allowedUids.has(uid) ? uid : null;
}
