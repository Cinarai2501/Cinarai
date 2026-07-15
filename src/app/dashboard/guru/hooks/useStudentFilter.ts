'use client';

import { useMemo, useState } from 'react';
import type { StudentDirectoryRow } from '../services/guru/students/students';

export type StudentFilterStatus = 'all' | 'active' | 'incomplete' | 'completed';

export function useStudentFilter(rows: StudentDirectoryRow[]) {
  const [filter, setFilter] = useState<StudentFilterStatus>('all');

  const filteredRows = useMemo(() => {
    switch (filter) {
      case 'active':
        return rows.filter((row) => row.isActive);
      case 'incomplete':
        return rows.filter((row) => !row.isCompleted && row.progress > 0);
      case 'completed':
        return rows.filter((row) => row.isCompleted);
      default:
        return rows;
    }
  }, [filter, rows]);

  return { filter, setFilter, filteredRows };
}
