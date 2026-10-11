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
  error: string | null;
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
    error: null,
  });

  useEffect(() => {
    if (!uid) {
      setState({
        uid: '', student: null, progressList: [], evaluation: null, reflections: [],
        activities: [], applicationActivities: [], identificationAnswers: [], loading: false, error: null,
      });
      return;
    }

    let active = true;
    const ready = new Set<string>();
    const sources = ['student', 'progress', 'reflections', 'activities', 'application', 'identification'];
    setState({
      uid, student: null, progressList: [], evaluation: null, reflections: [], activities: [],
      applicationActivities: [], identificationAnswers: [], loading: true, error: null,
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
    const fail = (source: string, error: Error) => {
      markReady(source);
      update({ error: error.message });
    };

    const unsubscribers = [
      subscribeStudentDoc(uid, (student) => {
        update({ student });
        markReady('student');
      }, (error) => fail('student', error)),
      subscribeStudentProgress(uid, (documents) => {
        const evaluationDocument = documents.find((document) => document.id === 'evaluation-cinarai');
        const evaluation = evaluationDocument?.evaluationCinarai as CinaraiEvaluationProgress | undefined;
        update({
          progressList: normalizeComicProgressDocuments(uid, documents),
          evaluation: evaluation ?? null,
        });
        markReady('progress');
      }, (error) => fail('progress', error)),
      subscribeStudentReflections(uid, (reflections) => {
        update({ reflections });
        markReady('reflections');
      }, (error) => fail('reflections', error)),
      subscribeStudentActivities(uid, (activities) => {
        update({ activities });
        markReady('activities');
      }, (error) => fail('activities', error)),
      subscribeStudentApplicationActivities(uid, (applicationActivities) => {
        update({ applicationActivities });
        markReady('application');
      }, (error) => fail('application', error)),
      subscribeStudentIdentificationAnswers(uid, (identificationAnswers) => {
        update({ identificationAnswers });
        markReady('identification');
      }, (error) => fail('identification', error)),
    ];

    return () => {
      active = false;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [uid]);

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
    error: null,
  };
  const comicProgress = comics.map((c) => ({
    comic: c,
    progress: currentState.progressList.find((p) => p.comicId === c.comicId) ?? null,
  }));

  return { ...currentState, comicProgress };
}
