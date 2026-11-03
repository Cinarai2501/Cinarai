'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { startApplicationActivitySync } from '../services/applicationActivityService';

export function ApplicationActivitySync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;
    return startApplicationActivitySync(user.uid);
  }, [user?.uid]);

  return null;
}
