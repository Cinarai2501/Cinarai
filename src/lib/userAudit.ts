import { type UserDocument, type UserRole } from '@/types/firestore';
import { isAllowedUserRole } from '@/lib/auth/role';

export interface DuplicateUserEntry {
  docId: string;
  uid: string | undefined;
  email: string | undefined;
  role: string | undefined;
  updatedAt: unknown;
}

export interface DuplicateUserReport {
  key: string;
  entries: DuplicateUserEntry[];
}

export function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function getUserDocumentIssues(user: UserDocument): string[] {
  const issues: string[] = [];

  if (!user.uid || typeof user.uid !== 'string' || user.uid.trim().length === 0) {
    issues.push('missingUid');
  }

  if (!user.role || !isAllowedUserRole(user.role)) {
    issues.push('missingOrInvalidRole');
  }

  return issues;
}

export function getTimestampMillis(value: unknown): number {
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

export function detectDuplicateUserDocuments(users: UserDocument[]): {
  emailDuplicates: DuplicateUserReport[];
  uidDuplicates: DuplicateUserReport[];
  missingUid: DuplicateUserEntry[];
  missingRole: DuplicateUserEntry[];
} {
  const emailMap = new Map<string, DuplicateUserEntry[]>();
  const uidMap = new Map<string, DuplicateUserEntry[]>();
  const missingUid: DuplicateUserEntry[] = [];
  const missingRole: DuplicateUserEntry[] = [];

  for (const user of users) {
    const docId = user.uid ?? 'unknown-doc';
    const uid = user.uid?.trim();
    const email = normalizeEmail(user.email);
    const entry: DuplicateUserEntry = {
      docId,
      uid,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt,
    };

    if (uid) {
      const existing = uidMap.get(uid) ?? [];
      existing.push(entry);
      uidMap.set(uid, existing);
    } else {
      missingUid.push(entry);
    }

    if (email) {
      const existing = emailMap.get(email) ?? [];
      existing.push(entry);
      emailMap.set(email, existing);
    }

    if (!user.role || !isAllowedUserRole(user.role)) {
      missingRole.push(entry);
    }
  }

  return {
    emailDuplicates: Array.from(emailMap.entries())
      .filter(([, entries]) => entries.length > 1)
      .map(([key, entries]) => ({ key, entries })),
    uidDuplicates: Array.from(uidMap.entries())
      .filter(([, entries]) => entries.length > 1)
      .map(([key, entries]) => ({ key, entries })),
    missingUid,
    missingRole,
  };
}

export interface DuplicateUserFlag {
  docId: string;
  duplicate: boolean;
  canonical: boolean;
}

export function buildDuplicateUserFlags(users: Array<UserDocument & { id: string }>): DuplicateUserFlag[] {
  const nodeMap = new Map<string, UserDocument & { id: string }>();
  const adjacency = new Map<string, Set<string>>();

  const addNode = (id: string, user: UserDocument & { id: string }) => {
    nodeMap.set(id, user);
    if (!adjacency.has(id)) {
      adjacency.set(id, new Set());
    }
  };

  const addEdge = (leftId: string, rightId: string) => {
    if (leftId === rightId) return;
    adjacency.get(leftId)?.add(rightId);
    adjacency.get(rightId)?.add(leftId);
  };

  for (const user of users) {
    addNode(user.id, user);
  }

  const emailGroups = new Map<string, Array<UserDocument & { id: string }>>();
  const uidGroups = new Map<string, Array<UserDocument & { id: string }>>();

  for (const user of users) {
    const emailKey = normalizeEmail(user.email);
    if (emailKey) {
      const existing = emailGroups.get(emailKey) ?? [];
      existing.push(user);
      emailGroups.set(emailKey, existing);
    }

    const uidKey = user.uid?.trim();
    if (uidKey) {
      const existing = uidGroups.get(uidKey) ?? [];
      existing.push(user);
      uidGroups.set(uidKey, existing);
    }
  }

  for (const group of emailGroups.values()) {
    for (let i = 1; i < group.length; i += 1) {
      addEdge(group[0].id, group[i].id);
    }
  }

  for (const group of uidGroups.values()) {
    for (let i = 1; i < group.length; i += 1) {
      addEdge(group[0].id, group[i].id);
    }
  }

  const visited = new Set<string>();
  const duplicateDocIds = new Set<string>();
  const canonicalDocIds = new Set<string>();

  const collectComponent = (startId: string): string[] => {
    const stack = [startId];
    const component: string[] = [];
    while (stack.length > 0) {
      const nodeId = stack.pop();
      if (!nodeId || visited.has(nodeId)) continue;
      visited.add(nodeId);
      component.push(nodeId);
      const neighbors = adjacency.get(nodeId);
      if (!neighbors) continue;
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          stack.push(neighborId);
        }
      }
    }
    return component;
  };

  for (const id of nodeMap.keys()) {
    if (visited.has(id)) continue;
    const component = collectComponent(id);
    if (component.length <= 1) continue;

    const canonicalId = component.reduce((bestId, candidateId) => {
      const bestDoc = nodeMap.get(bestId)!;
      const candidateDoc = nodeMap.get(candidateId)!;
      return getTimestampMillis(candidateDoc.updatedAt) > getTimestampMillis(bestDoc.updatedAt)
        ? candidateId
        : bestId;
    }, component[0]);

    canonicalDocIds.add(canonicalId);
    for (const docId of component) {
      if (docId !== canonicalId) {
        duplicateDocIds.add(docId);
      }
    }
  }

  return users.map((user) => ({
    docId: user.id,
    duplicate: duplicateDocIds.has(user.id),
    canonical: canonicalDocIds.has(user.id),
  }));
}

export function logUserAuditFindings(users: UserDocument[], context = 'user audit'): void {
  const findings = detectDuplicateUserDocuments(users);

  if (findings.emailDuplicates.length > 0) {
    console.warn(`[${context}] Duplicate email documents detected:`);
    for (const duplicate of findings.emailDuplicates) {
      console.warn(`  Email: ${duplicate.key}`);
      duplicate.entries.forEach((entry) => {
        console.warn(`    docId=${entry.docId}, uid=${entry.uid}, role=${entry.role}, updatedAt=${String(entry.updatedAt)}`);
      });
    }
  }

  if (findings.uidDuplicates.length > 0) {
    console.warn(`[${context}] Duplicate uid documents detected:`);
    for (const duplicate of findings.uidDuplicates) {
      console.warn(`  UID: ${duplicate.key}`);
      duplicate.entries.forEach((entry) => {
        console.warn(`    docId=${entry.docId}, email=${entry.email}, role=${entry.role}, updatedAt=${String(entry.updatedAt)}`);
      });
    }
  }

  if (findings.missingUid.length > 0) {
    console.warn(`[${context}] User documents missing uid:`);
    findings.missingUid.forEach((entry) => {
      console.warn(`  docId=${entry.docId}, email=${entry.email}, role=${entry.role}, updatedAt=${String(entry.updatedAt)}`);
    });
  }

  if (findings.missingRole.length > 0) {
    console.warn(`[${context}] User documents missing or invalid role:`);
    findings.missingRole.forEach((entry) => {
      console.warn(`  docId=${entry.docId}, uid=${entry.uid}, email=${entry.email}, role=${entry.role}, updatedAt=${String(entry.updatedAt)}`);
    });
  }
}

export function validateUserRole(role: unknown): UserRole | null {
  if (isAllowedUserRole(role)) {
    return role;
  }
  return null;
}

export function normalizeUserRole(role: unknown): UserRole {
  if (isAllowedUserRole(role)) {
    return role;
  }
  return 'student';
}
