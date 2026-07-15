'use client';

import type { ApplicationActivityDocument, IdentificationAnswerDocument, ReflectionDocument, UserDocument } from '@/types/firestore';

export type AIUsageSummary = {
  totalUses: number;
  topStage: string;
  topModule: string;
  averagePerStudent: number;
};

export function buildAIUsageSummary(
  students: UserDocument[],
  identificationAnswers: IdentificationAnswerDocument[],
  applicationActivities: ApplicationActivityDocument[],
  reflections: ReflectionDocument[],
  selectedClassId: string,
  selectedModuleId: number | 'all'
): AIUsageSummary {
  const filteredStudents = selectedClassId === 'all'
    ? students
    : students.filter((student) => {
        const label = student.schoolName
          ? student.schoolName
          : student.gradeLevel
          ? `Kelas ${student.gradeLevel}`
          : 'Tanpa kelas';
        return label === selectedClassId;
      });

  const studentIds = new Set(filteredStudents.map((student) => student.uid));

  const filteredIdentification = identificationAnswers.filter(
    (answer) => studentIds.has(answer.userId) && (selectedModuleId === 'all' || answer.comicId === selectedModuleId)
  );

  const filteredApplication = applicationActivities.filter(
    (activity) => studentIds.has(activity.userId) && (selectedModuleId === 'all' || activity.comicId === selectedModuleId)
  );

  const stageCounts: Record<string, number> = {
    Identification: filteredIdentification.filter((answer) => answer.aiTutorUsed).length,
    Application: filteredApplication.length,
    Introspection: reflections.filter((reflection) => studentIds.has(reflection.userId ?? reflection.studentId ?? '') && reflection.aiReflection != null).length,
  };

  const totalUses = filteredIdentification.filter((answer) => answer.aiTutorUsed).length + filteredApplication.length + stageCounts.Introspection;

  const topStage = Object.entries(stageCounts).reduce<string>((best, [stage, count]) => {
    if (!best) return stage;
    return count > stageCounts[best] ? stage : best;
  }, 'Identification');

  const moduleCounts = new Map<number, number>();
  filteredIdentification.forEach((answer) => {
    moduleCounts.set(answer.comicId, (moduleCounts.get(answer.comicId) ?? 0) + 1);
  });
  filteredApplication.forEach((activity) => {
    moduleCounts.set(activity.comicId, (moduleCounts.get(activity.comicId) ?? 0) + 1);
  });
  reflections.forEach((reflection) => {
    const comicId = typeof reflection.comicId === 'number' ? reflection.comicId : Number(reflection.comicId);
    if (!Number.isFinite(comicId) || !studentIds.has(reflection.userId ?? reflection.studentId ?? '')) return;
    if (selectedModuleId !== 'all' && comicId !== selectedModuleId) return;
    moduleCounts.set(comicId, (moduleCounts.get(comicId) ?? 0) + 1);
  });

  const topModule = [...moduleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([comicId]) => `Modul ${comicId}`)[0] ?? 'Tidak tersedia';

  const averagePerStudent = filteredStudents.length ? Math.round(totalUses / filteredStudents.length) : 0;

  return {
    totalUses,
    topStage: topStage || 'Tidak tersedia',
    topModule,
    averagePerStudent,
  };
}
