export const INTERNAL_AI_RATE_LIMIT_CODE = 'AI_INTERNAL_RATE_LIMIT';

export function getInternalAiRetryAfter(
  response: Pick<Response, 'status' | 'headers'>,
  payload: unknown,
): number {
  if (response.status !== 429
    || !payload
    || typeof payload !== 'object'
    || !('code' in payload)
    || payload.code !== INTERNAL_AI_RATE_LIMIT_CODE) {
    return 0;
  }
  const retryAfter = Number(response.headers.get('Retry-After'));
  return Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : 1;
}
