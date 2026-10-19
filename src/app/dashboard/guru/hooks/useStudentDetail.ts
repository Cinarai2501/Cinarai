'use client';

import { useEffect, useState } from 'react';
import {
  subscribeStudentActivities,
  subscribeStudentApplicationActivities,
  subscribeStudentDoc,
  subscribeStudentIdentificationAnswers,
  subscribeStudentProgress,
  subscribeStudentReflections,
} from '../services/firestoreService';
import { normalizeComicProgressDocuments } from '../services/studentNormalization';
import type { FirestoreOperationFailure } from '../services/firestoreDiagnostics';
import type { ComicDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';
import type { CinaraiEvaluationProgress } from '@/types/evaluation';

interface StudentDetailState {
  uid: string;
  student: UserDocument | null;
  progressList: ComicProgressDocument[];
  evaluation: CinaraiEvaluationProgress | null;
  reflections: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  applicationActivities: Record<string, unknown>[];
  identificationAnswers: Record<string, unknown>[];
  loading: boolean;
  errors: FirestoreOperationFailure[];
}

export function useStudentDetail(uid: string, comics: ComicDocument[]) {
  const [state, setState] = useState<StudentDetailState>({
    uid: '',
    student: null,
    progressList: [],
    evaluation: null,
    reflections: [],
    activities: [],
    applicationActivities: [],
    identificationAnswers: [],
    loading: true,
    errors: [],
  });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!uid) {
      setState({
        uid: '', student: null, progressList: [], evaluation: null, reflections: [],
        activities: [], applicationActivities: [], identificationAnswers: [], loading: false, errors: [],
      });
      return;
    }

    let active = true;
    const ready = new Set<string>();
    const sources = ['student', 'progress', 'reflections', 'activities', 'application', 'identification'];
    setState({
      uid, student: null, progressList: [], evaluation: null, reflections: [], activities: [],
      applicationActivities: [], identificationAnswers: [], loading: true, errors: [],
    });

    const update = (patch: Partial<StudentDetailState>) => {
      if (!active) return;
      setState((previous) => previous.uid === uid
        ? { ...previous, ...patch }
        : previous);
    };
    const markReady = (source: string) => {
      ready.add(source);
      update({ loading: sources.some((item) => !ready.has(item)) });
    };
    const fail = (source: string, failure: FirestoreOperationFailure) => {
      markReady(source);
      setState((previous) => previous.uid === uid
        ? {
            ...previous,
            errors: [
              ...previous.errors.filter((item) => item.operation !== failure.operation),
              failure,
            ],
          }
        : previous);
    };
    const clearFailure = (operation: string) => {
      setState((previous) => previous.uid === uid
        ? { ...previous, errors: previous.errors.filter((failure) => failure.operation !== operation) }
        : previous);
    };

    const unsubscribers = [
      subscribeStudentDoc(uid, (student) => {
        update({ student });
        clearFailure('subscribeStudentDoc');
        markReady('student');
      }, (failure) => fail('student', failure)),
      subscribeStudentProgress(uid, (documents) => {
        const evaluationDocument = documents.find((document) => document.id === 'evaluation-cinarai');
        const evaluation = evaluationDocument?.evaluationCinarai as CinaraiEvaluationProgress | undefined;
        update({
          progressList: normalizeComicProgressDocuments(uid, documents),
          evaluation: evaluation ?? null,
        });
        clearFailure('subscribeStudentProgress');
        markReady('progress');
      }, (failure) => fail('progress', failure), 'useStudentDetail', (operation) => clearFailure(operation)),
      subscribeStudentReflections(uid, (reflections) => {
        update({ reflections });
        markReady('reflections');
      }, (failure) => fail('reflections', failure), (operation) => clearFailure(operation)),
      subscribeStudentActivities(uid, (activities) => {
        update({ activities });
        clearFailure('subscribeStudentActivities');
        markReady('activities');
      }, (failure) => fail('activities', failure)),
      subscribeStudentApplicationActivities(uid, (applicationActivities) => {
        update({ applicationActivities });
        clearFailure('subscribeStudentApplicationActivities');
        markReady('application');
      }, (failure) => fail('application', failure)),
      subscribeStudentIdentificationAnswers(uid, (identificationAnswers) => {
        update({ identificationAnswers });
        clearFailure('subscribeStudentIdentificationAnswers');
        markReady('identification');
      }, (failure) => fail('identification', failure)),
    ];

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [uid, retryCount]);

  const currentState = state.uid === uid ? state : {
    ...state,
    student: null,
    progressList: [],
    evaluation: null,
    reflections: [],
    activities: [],
    applicationActivities: [],
    identificationAnswers: [],
    loading: Boolean(uid),
    errors: [],
  };
  const comicProgress = comics.map((c) => ({
    comic: c,
    progress: currentState.progressList.find((p) => p.comicId === c.comicId) ?? null,
  }));

  return { ...currentState, comicProgress, retry: () => setRetryCount((count) => count + 1) };
}
