import { loadStudentApplicationActivities, subscribeToStudentApplicationActivities } from './application';
import { loadStudentIdentificationAnswers, subscribeToStudentIdentificationAnswers } from './identificationAnswers';
import { loadStudentProfile, subscribeToStudentProfile } from './profile';
import { loadStudentProgress, subscribeToStudentProgress } from './progress';
import { loadStudentReflections, subscribeToStudentReflections } from './reflection';
import { loadStudentTimeline, subscribeToStudentTimeline } from './timeline';
import type { ActivityDocument, ApplicationActivityDocument, ComicProgressDocument, IdentificationAnswerDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import type { Unsubscribe } from 'firebase/firestore';

export interface StudentDetailData {
  profile: UserDocument | null;
  progressDocuments: ComicProgressDocument[];
  reflections: ReflectionDocument[];
  activities: ActivityDocument[];
  applicationActivities: ApplicationActivityDocument[];
  identificationAnswers: IdentificationAnswerDocument[];
}

export interface StudentDetailSubscriptions {
  profile: Unsubscribe;
  progress: Unsubscribe;
  reflections: Unsubscribe;
  activities: Unsubscribe;
  applicationActivities: Unsubscribe;
  identificationAnswers: Unsubscribe;
}

export async function loadStudentDetailData(studentId: string): Promise<StudentDetailData> {
  const [profile, progressDocuments, reflections, activities, applicationActivities, identificationAnswers] = await Promise.all([
    loadStudentProfile(studentId),
    loadStudentProgress(studentId),
    loadStudentReflections(studentId),
    loadStudentTimeline(studentId),
    loadStudentApplicationActivities(studentId),
    loadStudentIdentificationAnswers(studentId),
  ]);

  return {
    profile,
    progressDocuments,
    reflections,
    activities,
    applicationActivities,
    identificationAnswers,
  };
}

export function subscribeToStudentDetailData(
  studentId: string,
  callbacks: {
    onProfile: (profile: UserDocument | null) => void;
    onProgress: (progressDocuments: ComicProgressDocument[]) => void;
    onReflections: (reflections: ReflectionDocument[]) => void;
    onActivities: (activities: ActivityDocument[]) => void;
    onApplicationActivities: (applicationActivities: ApplicationActivityDocument[]) => void;
    onIdentificationAnswers: (answers: IdentificationAnswerDocument[]) => void;
    onError?: (error: Error) => void;
  }
): StudentDetailSubscriptions {
  return {
    profile: subscribeToStudentProfile(studentId, callbacks.onProfile, callbacks.onError),
    progress: subscribeToStudentProgress(studentId, callbacks.onProgress, callbacks.onError),
    reflections: subscribeToStudentReflections(studentId, callbacks.onReflections, callbacks.onError),
    activities: subscribeToStudentTimeline(studentId, callbacks.onActivities, callbacks.onError),
    applicationActivities: subscribeToStudentApplicationActivities(studentId, callbacks.onApplicationActivities, callbacks.onError),
    identificationAnswers: subscribeToStudentIdentificationAnswers(studentId, callbacks.onIdentificationAnswers, callbacks.onError),
  };
}
