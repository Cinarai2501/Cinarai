'use client';

import { useEffect, useMemo, useState } from 'react';
import { subscribeToUsers, subscribeToAllProgressDocuments, subscribeToComics } from '../services/teacher/dashboard/teacherDashboardFirestore';
import { buildStudentDirectoryRows } from '../services/teacher/students/students';
import type { ComicDocument, ComicProgressDocument, UserDocument } from '@/types/firestore';

export function useStudents() {
  const [students, setStudents] = useState<UserDocument[]>([]);
  const [progressDocuments, setProgressDocuments] = useState<ComicProgressDocument[]>([]);
  const [comics, setComics] = useState<ComicDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let usersLoaded = false;
    let progressLoaded = false;
    let comicsLoaded = false;

    const updateLoading = () => {
      if (!active) return;
      if (usersLoaded && progressLoaded && comicsLoaded) {
        setLoading(false);
      }
    };

    const usersUnsubscribe = subscribeToUsers(
      (nextUsers) => {
        if (!active) return;
        setStudents(nextUsers);
        usersLoaded = true;
        updateLoading();
      },
      (nextError) => {
        if (!active) return;
        setError(nextError.message);
        setLoading(false);
      }
    );

    const progressUnsubscribe = subscribeToAllProgressDocuments(
      (nextProgressDocuments) => {
        if (!active) return;
        setProgressDocuments(nextProgressDocuments);
        progressLoaded = true;
        updateLoading();
      },
      (nextError) => {
        if (!active) return;
        setError(nextError.message);
        setLoading(false);
      }
    );

    const comicsUnsubscribe = subscribeToComics(
      (nextComics) => {
        if (!active) return;
        setComics(nextComics);
        comicsLoaded = true;
        updateLoading();
      },
      (nextError) => {
        if (!active) return;
        setError(nextError.message);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      usersUnsubscribe();
      progressUnsubscribe();
      comicsUnsubscribe();
    };
  }, []);

  const rows = useMemo(
    () => buildStudentDirectoryRows(students, progressDocuments, comics),
    [students, progressDocuments, comics]
  );

  return { students, progressDocuments, rows, loading, error };
}
