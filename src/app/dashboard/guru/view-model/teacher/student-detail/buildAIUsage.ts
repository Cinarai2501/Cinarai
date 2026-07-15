import type { ApplicationActivityDocument } from '@/types/firestore';
import { toDateValue } from '@/app/teacher/studentDetail.utils';

export type StudentAIUsageSummary = {
  uses: number;
  lastQuestion: string | null;
  lastUsedAt: Date | null;
};

export function buildAIUsage(applicationActivities: ApplicationActivityDocument[]): StudentAIUsageSummary {
  const lastActivity = applicationActivities[0];

  return {
    uses: applicationActivities.length,
    lastQuestion: lastActivity?.coachMessage ?? null,
    lastUsedAt: toDateValue(lastActivity?.timestamp),
  };
}
