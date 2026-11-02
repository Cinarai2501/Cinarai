import { NextResponse } from 'next/server';
import { readBoundedJsonBody } from '@/app/api/dashboard/guru/requestBody';
import type { TutorResponse, TutorContext } from './service';
import type { AiRequestAccessResult } from './requestAccess';
import { validateTutorRequest } from './requestValidation';

type AiRateLimitResult =
  | { ok: true }
  | { ok: false; status: 429 | 503; error: string; retryAfterSeconds?: number };

export interface AiChatEndpointDependencies {
  authorize(request: Request): Promise<AiRequestAccessResult>;
  checkRateLimit(uid: string): Promise<AiRateLimitResult>;
  generate(context: TutorContext): Promise<TutorResponse>;
}

const MAX_CHAT_BODY_BYTES = 16_384;

function failureResponse(status: number, error: string, retryAfterSeconds?: number): NextResponse {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...(retryAfterSeconds ? { 'Retry-After': String(retryAfterSeconds) } : {}),
      },
    },
  );
}

export async function handleAiChatRequest(
  request: Request,
  dependencies: AiChatEndpointDependencies,
): Promise<NextResponse> {
  const access = await dependencies.authorize(request);
  if (!access.ok) return failureResponse(access.status, access.error, access.retryAfterSeconds);

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_CHAT_BODY_BYTES) {
    return failureResponse(413, 'Body permintaan melebihi batas ukuran.');
  }
  const parsedBody = await readBoundedJsonBody(request, MAX_CHAT_BODY_BYTES);
  if (!parsedBody.ok) {
    return failureResponse(
      parsedBody.reason === 'too_large' ? 413 : 400,
      parsedBody.reason === 'too_large'
        ? 'Body permintaan melebihi batas ukuran.'
        : 'Body permintaan tidak valid.',
    );
  }

  const validated = validateTutorRequest(parsedBody.value);
  if (!validated.ok) return failureResponse(400, validated.error);

  const rateLimit = await dependencies.checkRateLimit(access.uid);
  if (!rateLimit.ok) {
    return failureResponse(rateLimit.status, rateLimit.error, rateLimit.retryAfterSeconds);
  }

  try {
    const response = await dependencies.generate(validated.value.context);
    if (!response.answer.trim()) {
      return failureResponse(502, 'Tutor AI tidak menghasilkan jawaban yang dapat digunakan.');
    }
    return NextResponse.json(
      { answer: response.answer, provider: response.provider },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[ai/chat] AI Tutor request failed', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return failureResponse(
      502,
      'Maaf, Tutor AI sedang mengalami gangguan. Coba kirim pertanyaan lagi.',
    );
  }
}
