import { NextResponse } from 'next/server';

export type AiRequestAccessResult =
  | { ok: true; uid: string }
  | { ok: false; status: 401 | 403 | 429 | 503; error: string; retryAfterSeconds?: number };

export interface AiRequestAccessDependencies {
  verifyIdToken(token: string): Promise<{ uid?: unknown } | null>;
  getRole(uid: string): Promise<unknown>;
}

export async function resolveAiRequestAccess(
  authorization: string | null,
  allowedRoles: readonly string[],
  dependencies: AiRequestAccessDependencies,
): Promise<AiRequestAccessResult> {
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return { ok: false, status: 401, error: 'Sesi tidak valid.' };

  let decoded: { uid?: unknown } | null;
  try {
    decoded = await dependencies.verifyIdToken(match[1]);
  } catch {
    decoded = null;
  }
  if (!decoded || typeof decoded.uid !== 'string' || !decoded.uid.trim()) {
    return { ok: false, status: 401, error: 'Sesi tidak valid.' };
  }

  let role: unknown;
  try {
    role = await dependencies.getRole(decoded.uid);
  } catch {
    return { ok: false, status: 503, error: 'Layanan autentikasi sedang tidak tersedia.' };
  }
  if (typeof role !== 'string' || !allowedRoles.includes(role)) {
    return { ok: false, status: 403, error: 'Akun ini tidak memiliki akses ke fitur AI tersebut.' };
  }

  return { ok: true, uid: decoded.uid };
}

export function aiRequestAccessErrorResponse(result: Exclude<AiRequestAccessResult, { ok: true }>): NextResponse {
  const headers = result.retryAfterSeconds
    ? { 'Retry-After': String(result.retryAfterSeconds) }
    : undefined;
  return NextResponse.json({ error: result.error }, { status: result.status, headers });
}

export function aiRateLimitErrorResponse(
  result: { status: 429 | 503; error: string; retryAfterSeconds?: number },
): NextResponse {
  const headers = result.retryAfterSeconds
    ? { 'Retry-After': String(result.retryAfterSeconds) }
    : undefined;
  return NextResponse.json({ error: result.error }, { status: result.status, headers });
}
