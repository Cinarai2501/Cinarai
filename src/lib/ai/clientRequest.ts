'use client';

import { auth } from '@/lib/firebase/client';

export async function getAiAuthorizationHeader(): Promise<{ Authorization: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sesi login tidak tersedia. Silakan masuk kembali.');
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}
