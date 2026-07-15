import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!PROJECT_ID || !API_KEY) {
  console.error('Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_API_KEY in .env.local');
  process.exit(2);
}

type FirestoreValue = { stringValue?: string; integerValue?: string; booleanValue?: boolean; nullValue?: null } &
  Record<string, any>;

function parseValue(val: FirestoreValue): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('booleanValue' in val) return !!val.booleanValue;
  if ('nullValue' in val) return null;
  if ('mapValue' in val && val.mapValue.fields) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields)) out[k] = parseValue(v as FirestoreValue);
    return out;
  }
  if ('arrayValue' in val && val.arrayValue.values) {
    return (val.arrayValue.values as FirestoreValue[]).map(parseValue);
  }
  return null;
}

async function fetchUsers(): Promise<any[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const documents = data.documents ?? [];
  return documents.map((doc: any) => {
    const id = doc.name?.split('/').pop();
    const fields = doc.fields ?? {};
    const parsed: any = { id };
    for (const [k, v] of Object.entries(fields)) parsed[k] = parseValue(v as FirestoreValue);
    return parsed;
  });
}

async function main() {
  try {
    const users = await fetchUsers();
    const totalUsers = users.length;
    const totalTeachers = users.filter((u) => u.role === 'teacher').length;
    const totalStudents = users.filter((u) => u.role === 'student').length;
    const totalActive = users.filter((u) => !!u.isActive).length;
    const studentsWithGrade = users.filter((u) => u.role === 'student' && (typeof u.gradeLevel === 'number' || typeof u.gradeLevel === 'string')).length;
    const studentsWithoutGrade = totalStudents - studentsWithGrade;

    console.log('\n--- Dashboard Guru: Audit users collection (REST) ---\n');
    console.log({ totalUsers, totalTeachers, totalStudents, totalActive, studentsWithGrade, studentsWithoutGrade });

    const table = users.map((u) => ({ uid: u.uid ?? u.id, displayName: u.displayName ?? '', role: u.role ?? '', gradeLevel: u.gradeLevel ?? null, isActive: !!u.isActive }));
    console.table(table);

    if (totalStudents > 0) console.log('Dashboard Guru wajib menampilkan daftar siswa — kondisi terpenuhi.');
    else console.log('Tidak ditemukan siswa (role=="student"). Dashboard akan kosong.');

    if (studentsWithoutGrade > 0) console.log(`Jumlah siswa tanpa gradeLevel: ${studentsWithoutGrade}. Mereka akan dikelompokkan sebagai "Belum memiliki kelas".`);

    console.log('\n--- End audit ---\n');
  } catch (err) {
    console.error('Audit failed:', err);
    process.exitCode = 2;
  }
}

void main();
