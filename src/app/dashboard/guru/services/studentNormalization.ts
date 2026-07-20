import type { UserDocument } from '@/types/firestore';

function getTimestampMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === 'function') {
      const date = candidate.toDate();
      return date instanceof Date ? date.getTime() : 0;
    }
  }
  return 0;
}

export function normalizeStudentDocuments(users: UserDocument[]): UserDocument[] {
  const studentDocs = users.filter((user) => user.role === 'student');

  const latestByUid = new Map<string, UserDocument>();
  for (const student of studentDocs) {
    const uid = student.uid?.trim() ?? student.id?.trim() ?? '';
    if (!uid) continue;
    const existing = latestByUid.get(uid);
    if (!existing || getTimestampMillis(student.updatedAt) > getTimestampMillis(existing.updatedAt)) {
      latestByUid.set(uid, student);
    }
  }

  const latestByEmail = new Map<string, UserDocument>();
  for (const student of latestByUid.values()) {
    const emailKey = student.email?.trim().toLowerCase() ?? '';
    const existing = emailKey ? latestByEmail.get(emailKey) : undefined;
    if (emailKey) {
      if (!existing || getTimestampMillis(student.updatedAt) > getTimestampMillis(existing.updatedAt)) {
        latestByEmail.set(emailKey, student);
      }
    } else {
      latestByEmail.set(`__uid:${student.uid}`, student);
    }
  }

  return Array.from(latestByEmail.values()).sort((left, right) => {
    const leftName = left.displayName?.trim() ?? left.email?.trim() ?? '';
    const rightName = right.displayName?.trim() ?? right.email?.trim() ?? '';
    return leftName.localeCompare(rightName, 'id', { sensitivity: 'base' });
  });
}
