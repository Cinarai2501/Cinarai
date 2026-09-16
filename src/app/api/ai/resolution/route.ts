import { NextRequest, NextResponse } from 'next/server';
import { buildResolutionTutorExplanation, getResolutionMissions, type ResolutionMission } from '../../../../features/learning-engine/components/stages/resolutionStage.helpers';

export const runtime = 'nodejs';

type ReqBody = {
  selected?: string;
  attempt?: number;
  missionId?: number;
  comicId?: number;
  context?: {
    questionIndex?: number;
    question?: string;
    shape?: string;
    object?: string;
    choices?: Array<{ key: string; label: string }>;
  };
};

function buildCorrectExplanation(mission: ResolutionMission): string {
  return buildResolutionTutorExplanation(mission, true);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReqBody;
    const selected = (body.selected ?? '').toString().trim().toUpperCase();
    const attempt = Math.max(0, Number(body.attempt) || 0);
    const missionId = Number(body.missionId) || 1;
    const comicId = Number(body.comicId) || 1;
    const missions = getResolutionMissions(comicId, 'lokasi');
    const mission = missions.find((item) => item.id === missionId) ?? missions[0];
    const activeContext = body.context;
    const contextualMission = comicId === 6 && activeContext
      ? {
          ...mission,
          shape: activeContext.shape || mission.shape,
          part: activeContext.object || mission.part,
          prompt: activeContext.question || mission.prompt,
          options: activeContext.choices?.length === 4 ? activeContext.choices : mission.options,
          comicId: 6,
        }
      : mission;

    if (!selected) {
      return NextResponse.json({ error: 'selected is required' }, { status: 400 });
    }

    if (selected === contextualMission.correctKey) {
      return NextResponse.json({
        correct: true,
        explanation: buildCorrectExplanation(contextualMission),
        answer: contextualMission.answer,
      });
    }

    return NextResponse.json({
      correct: false,
      explanation: buildResolutionTutorExplanation(contextualMission, false),
      attempts: attempt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
