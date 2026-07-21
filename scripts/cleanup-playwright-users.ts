import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

function loadEnvValue(key: string): string | undefined {
  const value = process.env[key];
  if (value && value.trim().length > 0) return value;
  return undefined;
}

function loadEnvFromFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const env = fs.readFileSync(filePath, 'utf8');
  env.split(/\r?\n/).forEach((line) => {
    const maybeMatch = line.match(/^([^=]+)=(.*)$/);
    if (!maybeMatch) return;
    const [, rawKey, rawValue] = maybeMatch;
    const key = rawKey.trim();
    let value = rawValue;
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (!process.env[key] && value.trim().length > 0) {
      process.env[key] = value;
    }
  });
}

function getRequiredEnvVar(name: string): string {
  const value = loadEnvValue(name);
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function parsePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, '\n');
}

function matchesPlaywrightCandidate(displayName: unknown, email: unknown): boolean {
  const displayNameText = typeof displayName === 'string' ? displayName.toLowerCase() : '';
  const emailText = typeof email === 'string' ? email.toLowerCase() : '';

  if (displayNameText.includes('playwright')) return true;
  if (emailText.includes('playwright')) return true;
  if (emailText.includes('qa+playwright')) return true;
  if (emailText.includes('@example.com')) return true;

  return false;
}

async function deleteDocumentRecursively(docRef: FirebaseFirestore.DocumentReference): Promise<void> {
  const subcollections = await docRef.listCollections();
  for (const subcol of subcollections) {
    await deleteCollectionRecursively(subcol);
  }
  await docRef.delete();
}

async function deleteCollectionRecursively(collectionRef: FirebaseFirestore.CollectionReference): Promise<void> {
  const documents = await collectionRef.listDocuments();
  for (const document of documents) {
    await deleteDocumentRecursively(document);
  }
}

async function main(): Promise<void> {
  const envPath = path.resolve(process.cwd(), '.env.local');
  loadEnvFromFile(envPath);

  const projectId = getRequiredEnvVar('FIREBASE_PROJECT_ID');
  const clientEmail = getRequiredEnvVar('FIREBASE_CLIENT_EMAIL');
  const privateKey = parsePrivateKey(getRequiredEnvVar('FIREBASE_PRIVATE_KEY'));

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });

  const firestore = getFirestore();
  const auth = getAuth();

  console.log('Searching Playwright test users in users collection...');
  const snapshot = await firestore.collection('users').get();

  const candidates: Array<{ docId: string; uid: string | undefined; email: string | undefined; displayName: string | undefined }> = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const displayName = data.displayName;
    const email = data.email;
    if (matchesPlaywrightCandidate(displayName, email)) {
      candidates.push({
        docId: doc.id,
        uid: typeof data.uid === 'string' ? data.uid : undefined,
        email: typeof email === 'string' ? email : undefined,
        displayName: typeof displayName === 'string' ? displayName : undefined,
      });
    }
  });

  if (candidates.length === 0) {
    console.log('No Playwright test accounts found. Nothing to delete.');
    return;
  }

  console.log(`Found ${candidates.length} Playwright candidate account(s):`);
  candidates.forEach((candidate) => {
    console.log(`- uid=${candidate.uid ?? 'UNKNOWN'} docId=${candidate.docId} email=${candidate.email ?? 'MISSING'} displayName=${candidate.displayName ?? 'MISSING'}`);
  });

  const deletedAccounts: Array<{ uid: string | undefined; docId: string; email: string | undefined; displayName: string | undefined }> = [];

  for (const candidate of candidates) {
    const docRef = firestore.collection('users').doc(candidate.docId);
    console.log(`Deleting user document ${candidate.docId} and subcollections...`);
    await deleteDocumentRecursively(docRef);

    if (candidate.uid) {
      try {
        await auth.deleteUser(candidate.uid);
        console.log(`Deleted auth user uid=${candidate.uid}`);
      } catch (err) {
        console.warn(`Failed to delete auth user uid=${candidate.uid}:`, err instanceof Error ? err.message : err);
      }
    }
    deletedAccounts.push(candidate);
  }

  console.log('---');
  console.log(`Deleted ${deletedAccounts.length} Playwright testing account(s).`);
  deletedAccounts.forEach((candidate) => {
    console.log(`- uid=${candidate.uid ?? 'UNKNOWN'} email=${candidate.email ?? 'MISSING'} displayName=${candidate.displayName ?? 'MISSING'}`);
  });
}

main().catch((error) => {
  console.error('Cleanup failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
