import type { UserDocument } from '@/types/firestore';
import { getTimestampMillis, logUserAuditFindings, normalizeEmail } from '@/lib/userAudit';

function logDuplicateUsers(duplicateMap: Map<string, UserDocument[]>, type: string): void {
  if (duplicateMap.size === 0) return;
  console.warn(`[dashboard/guru] ${type} duplicate user documents detected:`);
  duplicateMap.forEach((users, key) => {
    console.warn(`  ${type}: ${key}`);
    users.forEach((user) => {
      console.warn(
        `    uid=${user.uid ?? 'missing'} email=${user.email ?? 'missing'} role=${user.role ?? 'missing'} updatedAt=${String(user.updatedAt)} id=${user.id ?? 'unknown'}`
      );
    });
  });
}

export function normalizeStudentDocuments(users: UserDocument[]): UserDocument[] {
  logUserAuditFindings(users, 'dashboard/guru user audit');

  const studentDocs = users.filter((user) => user.role === 'student' && user.duplicate !== true);

  const byUid = new Map<string, UserDocument[]>();
  const byEmail = new Map<string, UserDocument[]>();

  for (const student of studentDocs) {
    const uid = student.uid?.trim() ?? student.id?.trim() ?? '';
    const emailKey = normalizeEmail(student.email);
    if (uid) {
      const existing = byUid.get(uid) ?? [];
      existing.push(student);
      byUid.set(uid, existing);
    }
    if (emailKey) {
      const existing = byEmail.get(emailKey) ?? [];
      existing.push(student);
      byEmail.set(emailKey, existing);
    }
  }

  logDuplicateUsers(new Map(Array.from(byUid.entries()).filter(([, entries]) => entries.length > 1)), 'UID');
  logDuplicateUsers(new Map(Array.from(byEmail.entries()).filter(([, entries]) => entries.length > 1)), 'Email');

  const latestByUid = new Map<string, UserDocument>();
  for (const [uid, documents] of byUid.entries()) {
    const latest = documents.reduce((best, candidate) => {
      return getTimestampMillis(candidate.updatedAt) > getTimestampMillis(best.updatedAt) ? candidate : best;
    }, documents[0]);
    latestByUid.set(uid, latest);
  }

  const latestByEmail = new Map<string, UserDocument>();
  for (const student of latestByUid.values()) {
    const emailKey = normalizeEmail(student.email);
    if (!emailKey) {
      latestByEmail.set(`__uid:${student.uid}`, student);
      continue;
    }
    const existing = latestByEmail.get(emailKey);
    if (!existing || getTimestampMillis(student.updatedAt) > getTimestampMillis(existing.updatedAt)) {
      latestByEmail.set(emailKey, student);
    }
  }

  return Array.from(latestByEmail.values()).sort((left, right) => {
    const leftName = left.displayName?.trim() ?? left.email?.trim() ?? '';
    const rightName = right.displayName?.trim() ?? right.email?.trim() ?? '';
    return leftName.localeCompare(rightName, 'id', { sensitivity: 'base' });
  });
}
