import type { ActivityDocument, UserDocument } from '@/types/firestore';
import { formatFirestoreDate } from '@/app/guru/studentDetail.utils';
import { toDateValue } from '@/app/guru/studentDetail.utils';

export type StudentSummary = {
  displayName: string;
  roleLabel: string;
  lastActivityText: string;
  lastActivityAt: string;
};

export function buildStudentSummary(profile: UserDocument | null, activities: ActivityDocument[]) {
  const displayName = profile?.displayName?.trim() || profile?.email?.split('@')[0] || 'Siswa';
  const roleLabel = profile?.role === 'teacher' ? 'Guru' : 'Siswa';
  const lastActivity = activities[0];
  const lastActivityText = lastActivity?.title || lastActivity?.type || 'Belum ada aktivitas terbaru';
  const lastActivityAt = lastActivity?.occurredAt ? formatFirestoreDate(toDateValue(lastActivity.occurredAt)) : '—';

  return {
    displayName,
    roleLabel,
    lastActivityText,
    lastActivityAt,
  };
}
