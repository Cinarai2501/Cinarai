import { NextRequest, NextResponse } from 'next/server';
import { buildResolutionTutorExplanation, getResolutionMissions, type ResolutionMission } from '../../../../features/learning-engine/components/stages/resolutionStage.helpers';
import { getAiRequestAccess, checkAuthenticatedAiRateLimit } from '@/lib/ai/serverRequestAccess';
import { aiRateLimitErrorResponse, aiRequestAccessErrorResponse } from '@/lib/ai/requestAccess';
import { readBoundedJsonBody } from '@/app/api/dashboard/guru/requestBody';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = 8_192;

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
  const access = await getAiRequestAccess(request, ['student']);
  if (!access.ok) return aiRequestAccessErrorResponse(access);

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Body permintaan melebihi batas ukuran.' }, { status: 413 });
  }
  const parsedBody = await readBoundedJsonBody(request, MAX_BODY_BYTES);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === 'too_large' ? 'Body permintaan melebihi batas ukuran.' : 'Body permintaan tidak valid.' },
      { status: parsedBody.reason === 'too_large' ? 413 : 400 },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== 'object' || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: 'Body permintaan tidak valid.' }, { status: 400 });
  }
  const allowedBodyKeys = new Set(['selected', 'attempt', 'missionId', 'comicId', 'context']);
  if (Object.keys(parsedBody.value).some((key) => !allowedBodyKeys.has(key))) {
    return NextResponse.json({ error: 'Body permintaan tidak valid.' }, { status: 400 });
  }
  const body = parsedBody.value as ReqBody;
  const validInteger = (value: unknown, maximum: number) =>
    value === undefined || (Number.isInteger(value) && Number(value) >= 1 && Number(value) <= maximum);
  const contextKeys = new Set(['questionIndex', 'question', 'shape', 'object', 'choices']);
  if (typeof body.selected !== 'string' || !body.selected.trim() || body.selected.length > 10
    || !validInteger(body.comicId, 6)
    || !validInteger(body.missionId, 100)
    || (body.attempt !== undefined && (!Number.isInteger(body.attempt) || body.attempt < 0 || body.attempt > 100))
    || (body.context !== undefined && (
      typeof body.context !== 'object'
      || body.context === null
      || Object.keys(body.context).some((key) => !contextKeys.has(key))
      || (body.context.questionIndex !== undefined && (!Number.isInteger(body.context.questionIndex)
        || body.context.questionIndex < 0 || body.context.questionIndex > 200))
      || (body.context.question !== undefined && (typeof body.context.question !== 'string' || body.context.question.length > 500))
      || (body.context.shape !== undefined && (typeof body.context.shape !== 'string' || body.context.shape.length > 120))
      || (body.context.object !== undefined && (typeof body.context.object !== 'string' || body.context.object.length > 160))
      || (body.context.choices !== undefined && (
        !Array.isArray(body.context.choices)
        || body.context.choices.length > 4
        || !body.context.choices.every((choice) => choice
          && typeof choice.key === 'string' && choice.key.length <= 10
          && typeof choice.label === 'string' && choice.label.length <= 120)
      ))
    ))) {
    return NextResponse.json({ error: 'Parameter resolusi tidak valid.' }, { status: 400 });
  }
  const rateLimit = await checkAuthenticatedAiRateLimit(access.uid);
  if (!rateLimit.ok) return aiRateLimitErrorResponse(rateLimit);

  try {
    const selected = (body.selected ?? '').toString().trim().toUpperCase();
    const attempt = Math.max(0, Number(body.attempt) || 0);
    const missionId = Number(body.missionId) || 1;
    const comicId = Number(body.comicId) || 1;
    const missions = getResolutionMissions(comicId, 'lokasi');
    const mission = missions.find((item) => item.id === missionId);
    if (!mission) return NextResponse.json({ error: 'Misi pembelajaran tidak ditemukan.' }, { status: 400 });
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
    console.error('[ai/resolution] failed to generate explanation', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'Penjelasan pembelajaran sementara tidak tersedia.' }, { status: 500 });
  }
}
