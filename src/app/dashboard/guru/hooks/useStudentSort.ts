'use client';

import { useMemo, useState } from 'react';
import type { StudentDirectoryRow } from '../services/teacher/students/students';

export type StudentSortOption = 'name' | 'progress' | 'score' | 'activity';

export function useStudentSort(rows: StudentDirectoryRow[]) {
  const [sort, setSort] = useState<StudentSortOption>('name');

  const sortedRows = useMemo(() => {
    const nextRows = [...rows];

    nextRows.sort((left, right) => {
      switch (sort) {
        case 'progress':
          return right.progress - left.progress;
        case 'score':
          return right.averageScore - left.averageScore;
        case 'activity':
          return (right.lastActivityAt?.getTime() ?? 0) - (left.lastActivityAt?.getTime() ?? 0);
        default:
          return left.name.localeCompare(right.name);
      }
    });

    return nextRows;
  }, [rows, sort]);

  return { sort, setSort, sortedRows };
}
