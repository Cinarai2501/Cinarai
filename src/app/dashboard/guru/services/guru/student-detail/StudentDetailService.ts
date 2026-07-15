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

function getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export async function loadStudentDetailData(studentId: string): Promise<StudentDetailData> {
  const [profileResult, progressResult, reflectionsResult, activitiesResult, applicationActivitiesResult, identificationAnswersResult] = await Promise.allSettled([
    loadStudentProfile(studentId),
    loadStudentProgress(studentId),
    loadStudentReflections(studentId),
    loadStudentTimeline(studentId),
    loadStudentApplicationActivities(studentId),
    loadStudentIdentificationAnswers(studentId),
  ]);

  const profile = getSettledValue(profileResult, null);
  const progressDocuments = getSettledValue(progressResult, []);
  const reflections = getSettledValue(reflectionsResult, []);
  const activities = getSettledValue(activitiesResult, []);
  const applicationActivities = getSettledValue(applicationActivitiesResult, []);
  const identificationAnswers = getSettledValue(identificationAnswersResult, []);

  if (profileResult.status === 'rejected') {
    console.warn('[StudentDetail] profile failed', { errorCode: 'unknown', errorMessage: profileResult.reason instanceof Error ? profileResult.reason.message : String(profileResult.reason) });
  }
  if (progressResult.status === 'rejected') {
    console.warn('[StudentDetail] progress failed', { errorCode: 'unknown', errorMessage: progressResult.reason instanceof Error ? progressResult.reason.message : String(progressResult.reason) });
  }
  if (reflectionsResult.status === 'rejected') {
    console.warn('[StudentDetail] reflections failed', { errorCode: 'unknown', errorMessage: reflectionsResult.reason instanceof Error ? reflectionsResult.reason.message : String(reflectionsResult.reason) });
  }
  if (activitiesResult.status === 'rejected') {
    console.warn('[StudentDetail] activities failed', { errorCode: 'unknown', errorMessage: activitiesResult.reason instanceof Error ? activitiesResult.reason.message : String(activitiesResult.reason) });
  }
  if (applicationActivitiesResult.status === 'rejected') {
    console.warn('[StudentDetail] application activities failed', { errorCode: 'unknown', errorMessage: applicationActivitiesResult.reason instanceof Error ? applicationActivitiesResult.reason.message : String(applicationActivitiesResult.reason) });
  }
  if (identificationAnswersResult.status === 'rejected') {
    console.warn('[StudentDetail] identification answers failed', { errorCode: 'unknown', errorMessage: identificationAnswersResult.reason instanceof Error ? identificationAnswersResult.reason.message : String(identificationAnswersResult.reason) });
  }

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
