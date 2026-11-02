import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateApplicationRequest,
  validateArgumentationRequest,
  validateIntrospectionRequest,
  validateTutorRequest,
} from './requestValidation';

const tutorContext = {
  moduleName: 'CINARAI',
  identification: [],
  objectInfo: { location: 'Materi', classLevel: 'SD', synopsis: 'Belajar matematika', learningTargets: ['Numerasi'] },
  observationAnswers: {},
  sessionHistory: [{ role: 'user', content: 'Apa itu kubus?' }],
};

test('Tutor input accepts valid context and rejects long questions or forged identity fields', () => {
  assert.equal(validateTutorRequest({ question: 'Apa itu kubus?', context: tutorContext }).ok, true);
  assert.equal(validateTutorRequest({ question: 'x'.repeat(1_001), context: tutorContext }).ok, false);
  assert.equal(validateTutorRequest({
    question: 'Apa itu kubus?',
    studentUid: 'another-student',
    context: tutorContext,
  }).ok, false);
  assert.equal(validateTutorRequest({
    question: 'Apa itu kubus?',
    context: { ...tutorContext, uid: 'another-student' },
  }).ok, false);
});

test('Tutor input bounds session history and aggregate context size', () => {
  assert.equal(validateTutorRequest({
    question: 'Halo',
    context: { ...tutorContext, sessionHistory: [{ role: 'user', content: 'x'.repeat(1_001) }] },
  }).ok, false);
  assert.equal(validateTutorRequest({
    question: 'Halo',
    context: { ...tutorContext, knowledgeContext: 'x'.repeat(8_001) },
  }).ok, false);
});

test('AI Coach input requires bounded answer fields and rejects oversized arrays', () => {
  const valid = { jawabanSiswa: ['Kubus'], jawabanAlasan: 'Memiliki sisi persegi.' };
  assert.equal(validateApplicationRequest(valid).ok, true);
  assert.equal(validateApplicationRequest({ ...valid, jawabanAlasan: 'x'.repeat(1_001) }).ok, false);
  assert.equal(validateApplicationRequest({ ...valid, jawabanSiswa: Array(21).fill('jawaban') }).ok, false);
});

test('argumentation and introspection requests enforce bounded schemas', () => {
  const argumentation = {
    question: 'Jelaskan bentuk.',
    studentAnswer: 'Terlihat seperti balok.',
    shapeName: 'Balok',
    templePart: 'Bagian dasar',
    comicTitle: 'Komik',
    lokasi: 'Candi',
    classLevel: 'Kelas V',
  };
  assert.equal(validateArgumentationRequest(argumentation).ok, true);
  assert.equal(validateArgumentationRequest({ ...argumentation, studentAnswer: 'x'.repeat(1_001) }).ok, false);

  const introspection = { reflectionText: 'Saya belajar tentang bentuk.' };
  assert.equal(validateIntrospectionRequest(introspection).ok, true);
  assert.equal(validateIntrospectionRequest({ ...introspection, confidence: 6 }).ok, false);
  assert.equal(validateIntrospectionRequest({ ...introspection, reflectionText: 'x'.repeat(2_001) }).ok, false);
});
