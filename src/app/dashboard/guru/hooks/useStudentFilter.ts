'use client';

import { useMemo, useState } from 'react';
import type { StudentRow, StudentStatusFilter } from '../types';
import { filterAndSortStudents } from '../services/studentUtils';

export const STUDENT_PAGE_SIZE = 20;

export function useStudentFilter(rows: StudentRow[], totalComics: number) {
  const [search, setSearchValue] = useState('');
  const [status, setStatusValue] = useState<StudentStatusFilter>('all');
  const [sortKey, setSortKey] = useState<'name' | 'progress' | 'completed'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => filterAndSortStudents(rows, { search, status, sortKey, sortDir, totalComics }),
    [rows, search, status, sortKey, sortDir, totalComics]
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / STUDENT_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filtered.slice((currentPage - 1) * STUDENT_PAGE_SIZE, currentPage * STUDENT_PAGE_SIZE),
    [currentPage, filtered]
  );

  const setSearch = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };
  const setStatus = (value: StudentStatusFilter) => {
    setStatusValue(value);
    setPage(1);
  };
  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  return {
    filtered,
    visible,
    search,
    setSearch,
    status,
    setStatus,
    sortKey,
    sortDir,
    toggleSort,
    page: currentPage,
    pageCount,
    setPage,
  };
}
