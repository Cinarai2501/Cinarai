'use client';

import { useEffect, useState } from 'react';
import type { ActivityDocument, ApplicationActivityDocument, ComicProgressDocument, IdentificationAnswerDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import { loadStudentDetailData, subscribeToStudentDetailData } from '../services/teacher/student-detail/StudentDetailService';

export type StudentDetailSourceState = {
  profile: UserDocument | null;
  progressDocuments: ComicProgressDocument[];
  reflections: ReflectionDocument[];
  activities: ActivityDocument[];
  applicationActivities: ApplicationActivityDocument[];
  identificationAnswers: IdentificationAnswerDocument[];
  loading: boolean;
  error: string | null;
};

const initialState: StudentDetailSourceState = {
  profile: null,
  progressDocuments: [],
  reflections: [],
  activities: [],
  applicationActivities: [],
  identificationAnswers: [],
  loading: true,
  error: null,
};

export function useStudentDetailSource(studentId?: string) {
  const [state, setState] = useState<StudentDetailSourceState>(initialState);

  useEffect(() => {
    if (!studentId) {
      setState({ ...initialState, loading: false, error: 'ID siswa tidak tersedia.' });
      return;
    }

    let active = true;
    const loadError = (error: Error) => {
      if (!active) return;
      setState((current) => ({ ...current, loading: false, error: error.message || 'Gagal memuat data siswa.' }));
    };

    const subscriptions = subscribeToStudentDetailData(studentId, {
      onProfile: (profile) => {
        if (!active) return;
        setState((current) => ({ ...current, profile }));
      },
      onProgress: (progressDocuments) => {
        if (!active) return;
        setState((current) => ({ ...current, progressDocuments }));
      },
      onReflections: (reflections) => {
        if (!active) return;
        setState((current) => ({ ...current, reflections }));
      },
      onActivities: (activities) => {
        if (!active) return;
        setState((current) => ({ ...current, activities }));
      },
      onApplicationActivities: (applicationActivities) => {
        if (!active) return;
        setState((current) => ({ ...current, applicationActivities }));
      },
      onIdentificationAnswers: (identificationAnswers) => {
        if (!active) return;
        setState((current) => ({ ...current, identificationAnswers }));
      },
      onError: loadError,
    });

    loadStudentDetailData(studentId)
      .then(({ profile, progressDocuments, reflections, activities, applicationActivities, identificationAnswers }) => {
        if (!active) return;
        setState({
          profile,
          progressDocuments,
          reflections,
          activities,
          applicationActivities,
          identificationAnswers,
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (!active) return;
        loadError(error instanceof Error ? error : new Error('Gagal memuat data siswa.'));
      });

    return () => {
      active = false;
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe());
    };
  }, [studentId]);

  return state;
}
