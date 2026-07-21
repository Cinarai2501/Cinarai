import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin';
import type { UserDocument } from '@/types/firestore';

function parsePrivateKey(raw: string | undefined): string | null {
  if (!raw) return null;
  return raw.replace(/\\n/g, '\n').trim() || null;
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main() {
  const projectId = getRequiredEnvVar('FIREBASE_PROJECT_ID');
  const clientEmail = getRequiredEnvVar('FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = getRequiredEnvVar('FIREBASE_PRIVATE_KEY');
  const privateKey = parsePrivateKey(privateKeyRaw);
  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY is invalid or empty after newline normalization.');
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    } as ServiceAccount),
    projectId,
  });

  const firestore = getFirestore(app);
  const snapshot = await firestore.collection('users').get();

  const users = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as UserDocument),
  }));

  const byEmail = new Map<string, UserDocument[]>();
  const byUid = new Map<string, UserDocument[]>();
  const missingUid: UserDocument[] = [];
  const missingRole: UserDocument[] = [];

  const normalizeEmail = (value: unknown): string =>
    typeof value === 'string' ? value.trim().toLowerCase() : '';

  const getTimestampMillis = (value: unknown): number => {
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
  };

  for (const user of users) {
    const email = normalizeEmail(user.email);
    if (email) {
      const existing = byEmail.get(email) ?? [];
      existing.push(user);
      byEmail.set(email, existing);
    }

    if (user.uid && typeof user.uid === 'string' && user.uid.trim().length > 0) {
      const existing = byUid.get(user.uid) ?? [];
      existing.push(user);
      byUid.set(user.uid, existing);
    } else {
      missingUid.push(user);
    }

    if (!user.role || !['student', 'teacher', 'admin'].includes(user.role)) {
      missingRole.push(user);
    }
  }

  const emailDups = Array.from(byEmail.entries()).filter(([, entries]) => entries.length > 1);
  const uidDups = Array.from(byUid.entries()).filter(([, entries]) => entries.length > 1);

  console.log(`Total user documents: ${users.length}`);
  console.log(`Duplicate email groups: ${emailDups.length}`);
  console.log(`Duplicate uid groups: ${uidDups.length}`);
  console.log(`Documents missing uid: ${missingUid.length}`);
  console.log(`Documents missing role: ${missingRole.length}`);

  if (emailDups.length > 0) {
    console.log('\nDuplicate email report:');
    for (const [email, entries] of emailDups) {
      console.log(`\nemail=${email}`);
      entries.forEach((entry) => {
        console.log(`  docId=${entry.id} uid=${entry.uid ?? 'missing'} role=${entry.role ?? 'missing'} updatedAt=${String(entry.updatedAt)}`);
      });
    }
  }

  if (uidDups.length > 0) {
    console.log('\nDuplicate uid report:');
    for (const [uid, entries] of uidDups) {
      console.log(`\nuid=${uid}`);
      entries.forEach((entry) => {
        console.log(`  docId=${entry.id} email=${entry.email ?? 'missing'} role=${entry.role ?? 'missing'} updatedAt=${String(entry.updatedAt)}`);
      });
    }
  }

  if (missingUid.length > 0) {
    console.log('\nDocuments missing uid:');
    missingUid.forEach((entry) => {
      console.log(`  docId=${entry.id} email=${entry.email ?? 'missing'} role=${entry.role ?? 'missing'} updatedAt=${String(entry.updatedAt)}`);
    });
  }

  if (missingRole.length > 0) {
    console.log('\nDocuments missing or invalid role:');
    missingRole.forEach((entry) => {
      console.log(`  docId=${entry.id} uid=${entry.uid ?? 'missing'} email=${entry.email ?? 'missing'} updatedAt=${String(entry.updatedAt)}`);
    });
  }

  const duplicateDocIds = new Set<string>();

  const markDuplicateGroup = (entries: UserDocument[]) => {
    const sorted = entries.slice().sort((left, right) => getTimestampMillis(right.updatedAt) - getTimestampMillis(left.updatedAt));
    sorted.slice(1).forEach((entry) => duplicateDocIds.add(entry.id));
  };

  emailDups.forEach(([, entries]) => markDuplicateGroup(entries));
  uidDups.forEach(([, entries]) => markDuplicateGroup(entries));

  if (duplicateDocIds.size > 0) {
    console.log(`\nMarking ${duplicateDocIds.size} duplicate user documents as duplicate=true`);
  }

  const updatePromises = users.map((user) => {
    const isDuplicate = duplicateDocIds.has(user.id);
    return firestore.collection('users').doc(user.id).set({ duplicate: isDuplicate }, { merge: true });
  });

  await Promise.all(updatePromises);
  console.log('Duplicate flag update complete.');
}

main().catch((error) => {
  console.error('Duplicate user detection failed:', error);
  process.exit(1);
});
