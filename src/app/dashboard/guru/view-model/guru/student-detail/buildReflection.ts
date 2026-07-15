import type { ReflectionDocument } from '@/types/firestore';
import { toDateValue } from '@/app/guru/studentDetail.utils';

export type StudentReflectionSummary = {
  text: string;
  rating: number | null;
  aiReflection: { appreciation: string; needsImprovement: string; suggestion: string } | null;
  stage: string;
  submittedAt: Date | null;
};

export function buildReflection(reflections: ReflectionDocument[]): StudentReflectionSummary | null {
  if (!reflections.length) return null;

  const latest = reflections[reflections.length - 1];

  return {
    text: latest.reflectionText ?? '',
    rating: latest.rating ?? null,
    aiReflection: typeof latest.aiReflection === 'object' ? latest.aiReflection : null,
    stage: latest.stage ?? 'Introspection',
    submittedAt: toDateValue(latest.submittedAt),
  };
}
