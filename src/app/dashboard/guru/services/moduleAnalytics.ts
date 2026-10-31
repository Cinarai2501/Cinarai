import type { ComicProgressDocument } from '@/types/firestore';
import type { ComicModuleLike } from '@/features/comics/types';
import type { StudentRow } from '../types';
import { getModuleStudentStatus } from './progressStatus';

export { getModuleStudentStatus } from './progressStatus';

export type ModuleStudentStatus = 'not_started' | 'learning' | 'completed';

export interface ModuleRosterSummary {
  studentCount: number;
  startedCount: number;
  learningCount: number;
  completedCount: number;
  completionRate: number | null;
}

export interface ModuleDetailResponse {
  limitations: string[];
  comic: {
    comicId: number;
    title: string;
    subtitle: string;
    description: string;
    learningTargets: string[];
    pdfUrl: string | null;
  };
  blueprint: Array<{
    id: string;
    title: string;
    available: boolean;
    contentCount: number;
    completedStudents: number | null;
  }>;
  summary: {
    studentCount: number;
    startedCount: number;
    learningCount: number;
    completedCount: number;
    completionRate: number | null;
    answeredCount: number;
    correctAnswerCount: number;
    quizAverage: number | null;
    argumentationAverage: number | null;
    applicationAverage: number | null;
    applicationActivityCount: number;
    reflectionCount: number;
  };
  students: Array<{
    uid: string;
    name: string;
    email: string;
    status: ModuleStudentStatus;
    progress: number | null;
    completedStages: string[];
    quizScore: number | null;
    argumentationScore: number | null;
    applicationScore: number | null;
    incorrectAnswers: number;
    lowConfidence: number | null;
  }>;
  questions: Array<{ question: string; answeredCount: number; incorrectCount: number }>;
  answers: Array<{
    studentName: string;
    question: string;
    selectedAnswer: string;
    correctAnswer: string | null;
    correct: boolean | null;
    date: string | null;
  }>;
  activities: Array<{ studentName: string; stage: string; label: string; date: string | null }>;
}

export function buildModuleBlueprint(
  module: ComicModuleLike,
  completedStudentsByStage: Map<string, number>
): ModuleDetailResponse['blueprint'] {
  const stages = [
    { id: 'Contextualization', title: 'Kontekstualisasi', available: Boolean(module.metadata.synopsis.trim()), contentCount: module.metadata.synopsis.trim() ? 1 : 0 },
    { id: 'Identification', title: 'Identifikasi', available: module.identification.questions.length > 0, contentCount: module.identification.questions.length },
    {
      id: 'Navigation',
      title: 'Navigasi AR + AI',
      available: module.navigation.learningObjects.length > 0 || module.navigation.qrCode.length > 0 || module.navigation.model3D.length > 0,
      contentCount: module.navigation.learningObjects.length + module.navigation.qrCode.length + module.navigation.model3D.length,
    },
    { id: 'Argumentation', title: 'Argumentasi', available: module.argumentation.questions.length > 0, contentCount: module.argumentation.questions.length },
    { id: 'Resolution', title: 'Resolusi', available: module.resolution.missions.length > 0, contentCount: module.resolution.missions.length },
    {
      id: 'Application',
      title: 'Aplikasi',
      available: module.application.images.length > 0 || module.application.options.length > 0 || (module.application.cards?.length ?? 0) > 0,
      contentCount: module.application.images.length + module.application.options.length + (module.application.cards?.length ?? 0),
    },
    { id: 'Introspection', title: 'Introspeksi', available: module.introspection.checklist.length > 0, contentCount: module.introspection.checklist.length },
    { id: 'Report', title: 'Laporan', available: Boolean(module.report.summary.trim()), contentCount: module.report.learnedShapes.length },
  ];
  return stages.map((stage) => ({
    ...stage,
    completedStudents: !stage.available || stage.id === 'Report'
      ? null
      : completedStudentsByStage.get(stage.id) ?? 0,
  }));
}

export function getModuleProgress(student: StudentRow, comicId: number): ComicProgressDocument | null {
  return student.progressList.find((progress) => progress.comicId === comicId) ?? null;
}

export function getModuleRosterSummary(rows: StudentRow[], comicId: number): ModuleRosterSummary {
  const students = rows.map((student) => ({
    status: getModuleStudentStatus(getModuleProgress(student, comicId)),
  }));
  const completedCount = students.filter(({ status }) => status === 'completed').length;
  return {
    studentCount: rows.length,
    startedCount: students.filter(({ status }) => status !== 'not_started').length,
    learningCount: students.filter(({ status }) => status === 'learning').length,
    completedCount,
    completionRate: rows.length ? Math.round((completedCount / rows.length) * 100) : null,
  };
}
