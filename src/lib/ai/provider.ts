export type AiProviderName = 'gemini' | 'groq' | 'openrouter' | 'openai';

export interface AiRequestPayload {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AiResponse {
  provider: AiProviderName;
  content: string;
  fallbackUsed?: boolean;
  raw?: unknown;
}

export interface AiProvider {
  name: AiProviderName;
  generate(payload: AiRequestPayload, signal?: AbortSignal): Promise<AiResponse>;
}

export interface AiProviderConfig {
  apiKey?: string;
  apiKeys?: string[];
  model?: string;
  baseUrl?: string;
}

export type AiProviderFailureCategory =
  | 'invalid_key'
  | 'permission'
  | 'not_found'
  | 'quota_exhausted'
  | 'rate_limited'
  | 'timeout'
  | 'network'
  | 'provider'
  | 'unknown';

export type AiProviderErrorCode =
  | 'INSUFFICIENT_QUOTA'
  | 'BILLING_HARD_LIMIT_REACHED'
  | 'CREDIT_BALANCE_EXHAUSTED'
  | 'ORGANIZATION_SPEND_LIMIT_EXCEEDED'
  | 'PROJECT_SPEND_LIMIT_EXCEEDED'
  | 'ORGANIZATION_USAGE_LIMIT_EXCEEDED'
  | 'QUOTA_EXCEEDED'
  | 'RESOURCE_EXHAUSTED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'RATE_LIMIT_ERROR'
  | 'SLOW_DOWN'
  | 'INVALID_API_KEY'
  | 'API_KEY_INVALID'
  | 'PERMISSION_DENIED'
  | 'MODEL_NOT_FOUND'
  | 'NOT_FOUND'
  | 'ACCOUNT_DEACTIVATED'
  | 'KEY_EXPIRED'
  | 'NO_CANDIDATE'
  | 'MAX_TOKENS'
  | 'SAFETY'
  | 'RECITATION'
  | 'BLOCKLIST'
  | 'PROHIBITED_CONTENT'
  | 'STOP';

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryAfterMs?: number,
    public readonly failureType?: AiProviderFailureCategory,
    public readonly failureReasons?: string[],
    public readonly providerErrorCode?: AiProviderErrorCode,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export function getRetryAfterMs(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : undefined;
}

const SAFE_PROVIDER_ERROR_CODES = new Set<AiProviderErrorCode>([
  'INSUFFICIENT_QUOTA',
  'BILLING_HARD_LIMIT_REACHED',
  'CREDIT_BALANCE_EXHAUSTED',
  'ORGANIZATION_SPEND_LIMIT_EXCEEDED',
  'PROJECT_SPEND_LIMIT_EXCEEDED',
  'ORGANIZATION_USAGE_LIMIT_EXCEEDED',
  'QUOTA_EXCEEDED',
  'RESOURCE_EXHAUSTED',
  'RATE_LIMIT_EXCEEDED',
  'RATE_LIMIT_ERROR',
  'SLOW_DOWN',
  'INVALID_API_KEY',
  'API_KEY_INVALID',
  'PERMISSION_DENIED',
  'MODEL_NOT_FOUND',
  'NOT_FOUND',
  'ACCOUNT_DEACTIVATED',
  'KEY_EXPIRED',
  'NO_CANDIDATE',
  'MAX_TOKENS',
  'SAFETY',
  'RECITATION',
  'BLOCKLIST',
  'PROHIBITED_CONTENT',
  'STOP',
]);

function extractSafeProviderErrorCode(body?: string): AiProviderErrorCode | undefined {
  if (!body) return undefined;
  try {
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== 'object') return undefined;
    const root = parsed as Record<string, unknown>;
    const error = root.error && typeof root.error === 'object'
      ? root.error as Record<string, unknown>
      : root;
    const candidates = [
      error.code,
      error.type,
      error.status,
      ...(Array.isArray(error.details)
        ? error.details.flatMap((detail) => (
          detail && typeof detail === 'object'
            ? [(detail as Record<string, unknown>).reason, (detail as Record<string, unknown>).type]
            : []
        ))
        : []),
    ];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const normalized = candidate.trim().toUpperCase().replace(/[\s-]+/g, '_');
      if (SAFE_PROVIDER_ERROR_CODES.has(normalized as AiProviderErrorCode)) {
        return normalized as AiProviderErrorCode;
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function getAiProviderFailureCategory(
  statusCode?: number,
  providerErrorCode?: AiProviderErrorCode,
): AiProviderFailureCategory {
  if (statusCode === 401 || providerErrorCode === 'INVALID_API_KEY' || providerErrorCode === 'API_KEY_INVALID') {
    return 'invalid_key';
  }
  if (statusCode === 403 || providerErrorCode === 'PERMISSION_DENIED' || providerErrorCode === 'ACCOUNT_DEACTIVATED') {
    return 'permission';
  }
  if (statusCode === 404 || providerErrorCode === 'MODEL_NOT_FOUND' || providerErrorCode === 'NOT_FOUND') {
    return 'not_found';
  }
  if (
    providerErrorCode === 'INSUFFICIENT_QUOTA'
    || providerErrorCode === 'BILLING_HARD_LIMIT_REACHED'
    || providerErrorCode === 'CREDIT_BALANCE_EXHAUSTED'
    || providerErrorCode === 'ORGANIZATION_SPEND_LIMIT_EXCEEDED'
    || providerErrorCode === 'PROJECT_SPEND_LIMIT_EXCEEDED'
    || providerErrorCode === 'ORGANIZATION_USAGE_LIMIT_EXCEEDED'
    || providerErrorCode === 'QUOTA_EXCEEDED'
    || providerErrorCode === 'RESOURCE_EXHAUSTED'
  ) {
    return 'quota_exhausted';
  }
  if (
    statusCode === 429
    || providerErrorCode === 'RATE_LIMIT_EXCEEDED'
    || providerErrorCode === 'RATE_LIMIT_ERROR'
    || providerErrorCode === 'SLOW_DOWN'
  ) {
    return 'rate_limited';
  }
  if (statusCode !== undefined && statusCode >= 500) return 'provider';
  return 'unknown';
}

export function createAiProviderHttpError(response: Response, body?: string): AiProviderError {
  const providerErrorCode = extractSafeProviderErrorCode(body);
  const failureType = getAiProviderFailureCategory(response.status, providerErrorCode);
  return new AiProviderError(
    `Provider returned HTTP ${response.status}`,
    response.status,
    getRetryAfterMs(response.headers.get('retry-after')),
    failureType,
    undefined,
    providerErrorCode,
  );
}

export function createAiProviderConfig(overrides: Partial<AiProviderConfig> = {}): AiProviderConfig {
  return {
    apiKey: overrides.apiKey,
    apiKeys: overrides.apiKeys,
    model: overrides.model,
    baseUrl: overrides.baseUrl,
  };
}

export function summarizeResponseBody(body: unknown): string {
  if (typeof body === 'string') {
    return body.length > 400 ? `${body.slice(0, 400)}…` : body;
  }

  try {
    const value = JSON.stringify(body);
    return value.length > 400 ? `${value.slice(0, 400)}…` : value;
  } catch {
    return '[unserializable]';
  }
}
