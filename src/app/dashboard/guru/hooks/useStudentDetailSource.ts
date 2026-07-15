'use client';

import { useEffect, useState } from 'react';
import type { ActivityDocument, ApplicationActivityDocument, ComicProgressDocument, ReflectionDocument, UserDocument } from '@/types/firestore';
import { loadStudentApplicationActivities, subscribeToStudentApplicationActivities } from '../services/teacher/student-detail/application';
import { loadStudentProfile, subscribeToStudentProfile } from '../services/teacher/student-detail/profile';
import { loadStudentProgress, subscribeToStudentProgress } from '../services/teacher/student-detail/progress';
import { loadStudentReflections, subscribeToStudentReflections } from '../services/teacher/student-detail/reflection';
import { loadStudentTimeline, subscribeToStudentTimeline } from '../services/teacher/student-detail/timeline';

export type StudentDetailSourceState = {
  profile: UserDocument | null;
  progressDocuments: ComicProgressDocument[];
  reflections: ReflectionDocument[];
  activities: ActivityDocument[];
  applicationActivities: ApplicationActivityDocument[];
  loading: boolean;
  error: string | null;
};

const initialState: StudentDetailSourceState = {
  profile: null,
  progressDocuments: [],
  reflections: [],
  activities: [],
  applicationActivities: [],
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

    const profileUnsub = subscribeToStudentProfile(
      studentId,
      (profile) => {
        if (!active) return;
        setState((current) => ({ ...current, profile }));
      },
      loadError
    );

    const progressUnsub = subscribeToStudentProgress(
      studentId,
      (progressDocuments) => {
        if (!active) return;
        setState((current) => ({ ...current, progressDocuments }));
      },
      loadError
    );

    const reflectionsUnsub = subscribeToStudentReflections(
      studentId,
      (reflections) => {
        if (!active) return;
        setState((current) => ({ ...current, reflections }));
      },
      loadError
    );

    const activitiesUnsub = subscribeToStudentTimeline(
      studentId,
      (activities) => {
        if (!active) return;
        setState((current) => ({ ...current, activities }));
      },
      loadError
    );

    const applicationUnsub = subscribeToStudentApplicationActivities(
      studentId,
      (applicationActivities) => {
        if (!active) return;
        setState((current) => ({ ...current, applicationActivities }));
      },
      loadError
    );

    Promise.all([
      loadStudentProfile(studentId),
      loadStudentProgress(studentId),
      loadStudentReflections(studentId),
      loadStudentTimeline(studentId),
      loadStudentApplicationActivities(studentId),
    ])
      .then(([profile, progressDocuments, reflections, activities, applicationActivities]) => {
        if (!active) return;
        setState({
          profile,
          progressDocuments,
          reflections,
          activities,
          applicationActivities,
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
      profileUnsub();
      progressUnsub();
      reflectionsUnsub();
      activitiesUnsub();
      applicationUnsub();
    };
  }, [studentId]);

  return state;
}
