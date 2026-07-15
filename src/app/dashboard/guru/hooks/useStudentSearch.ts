'use client';

import { useMemo, useState } from 'react';
import type { StudentDirectoryRow } from '../services/guru/students/students';

export function useStudentSearch(rows: StudentDirectoryRow[]) {
  const [query, setQuery] = useState('');

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter((row) => {
      const haystack = [row.name, row.email, row.grade].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query, rows]);

  return { query, setQuery, filteredRows };
}
