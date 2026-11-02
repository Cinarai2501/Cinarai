import { NextRequest } from 'next/server';
import { generateTutorResponse } from '@/lib/ai';
import { handleAiChatRequest } from '@/lib/ai/chatEndpoint';
import { getAiRequestAccess, checkAuthenticatedAiRateLimit } from '@/lib/ai/serverRequestAccess';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  return handleAiChatRequest(request, {
    authorize: (incomingRequest) => getAiRequestAccess(incomingRequest, ['student']),
    checkRateLimit: checkAuthenticatedAiRateLimit,
    generate: (context) => generateTutorResponse(context, undefined, { throwOnError: true }),
  });
}
