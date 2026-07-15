import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getFirestoreCollection } from '../src/services/firestore';

async function main() {
  try {
    const users = await getFirestoreCollection('users');

    const totalUsers = users.length;
    const totalTeachers = users.filter((u: any) => u.role === 'teacher').length;
    const totalStudents = users.filter((u: any) => u.role === 'student').length;
    const totalActive = users.filter((u: any) => !!u.isActive).length;
    const studentsWithGrade = users.filter((u: any) => u.role === 'student' && (typeof u.gradeLevel === 'number' || typeof u.gradeLevel === 'string')).length;
    const studentsWithoutGrade = totalStudents - studentsWithGrade;

    console.log('\n--- Dashboard Guru: Audit users collection ---\n');

    console.log('Totals:');
    console.log({ totalUsers, totalTeachers, totalStudents, totalActive, studentsWithGrade, studentsWithoutGrade });

    const table = users.map((u: any) => ({ uid: u.uid ?? u.id ?? null, displayName: u.displayName ?? '', role: u.role ?? '', gradeLevel: u.gradeLevel ?? null, isActive: !!u.isActive }));

    console.log('\nUser list (uid, displayName, role, gradeLevel, isActive):');
    console.table(table);

    if (totalStudents > 0) {
      console.log('Dashboard Guru wajib menampilkan daftar siswa — kondisi terpenuhi.');
    } else {
      console.log('Tidak ditemukan siswa (role=="student"). Dashboard akan kosong.');
    }

    if (studentsWithoutGrade > 0) {
      console.log(`Jumlah siswa tanpa gradeLevel: ${studentsWithoutGrade}. Mereka akan dikelompokkan sebagai "Belum memiliki kelas".`);
    }

    console.log('\n--- End audit ---\n');
  } catch (err) {
    console.error('Audit failed:', err);
    process.exitCode = 2;
  }
}

void main();
