import { NextResponse } from 'next/server';
import { AiRouter } from '@/lib/ai/router';
import { checkAiProvidersHealth, getLastAiProviderHealthChecks } from '@/lib/ai/healthCheck';
import { getAiRequestAccess, checkAuthenticatedAiRateLimit } from '@/lib/ai/serverRequestAccess';
import { aiRateLimitErrorResponse, aiRequestAccessErrorResponse } from '@/lib/ai/requestAccess';

function isDevelopmentRequest(): boolean {
  return process.env.NODE_ENV === 'development';
}

export async function GET(request: Request) {
  if (!isDevelopmentRequest()) {
    return NextResponse.json({ error: 'Not available in non-development environments.' }, { status: 404 });
  }

  const access = await getAiRequestAccess(request, ['admin']);
  if (!access.ok) return aiRequestAccessErrorResponse(access);

  return NextResponse.json(
    { providers: getLastAiProviderHealthChecks() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  if (!isDevelopmentRequest()) {
    return NextResponse.json({ error: 'Not available in non-development environments.' }, { status: 404 });
  }

  const access = await getAiRequestAccess(request, ['admin']);
  if (!access.ok) return aiRequestAccessErrorResponse(access);
  const rateLimit = await checkAuthenticatedAiRateLimit(access.uid);
  if (!rateLimit.ok) return aiRateLimitErrorResponse(rateLimit);

  const router = AiRouter.createDefault();
  const providers = await checkAiProvidersHealth(router.providers);
  return NextResponse.json(
    { providers },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
