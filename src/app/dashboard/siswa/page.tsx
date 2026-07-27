'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardSiswaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/siswa/home');
  }, [router]);

  return null;
}
