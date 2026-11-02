import { getAiProviderRuntimeStatus, AI_PROVIDER_NAMES } from './debug';
import { AiProviderError, getAiProviderFailureCategory } from './provider';
import type { AiProvider, AiProviderFailureCategory, AiProviderName, AiRequestPayload } from './provider';

export type AiProviderHealthStatus =
  | 'Healthy'
  | 'Unavailable'
  | 'Rate Limited'
  | 'Quota Exhausted'
  | 'Invalid Key'
  | 'Permission Error'
  | 'Not Found'
  | 'Timeout'
  | 'Unknown';

export interface AiProviderHealthResult {
  provider: AiProviderName;
  configuration: 'Configured' | 'Not Configured';
  status: AiProviderHealthStatus;
  httpStatus: number | null;
  failureReason: string | null;
  failureCategory?: AiProviderFailureCategory;
  providerErrorCode?: AiProviderError['providerErrorCode'];
  lastCheckedAt: string | null;
  durationMs: number | null;
  fallbackAvailable: boolean;
}

const HEALTH_CHECK_TIMEOUT_MS = 5_000;
const healthCheckPayload: AiRequestPayload = {
  prompt: 'Reply with OK only.',
  systemPrompt: 'Health check. Return only OK.',
  temperature: 0,
  maxTokens: 32,
  metadata: { aiHealthCheck: true },
};
const lastHealthChecks = new Map<AiProviderName, AiProviderHealthResult>();

function classifyFailure(error: unknown): AiProviderHealthStatus {
  if (error instanceof AiProviderError) {
    const category = error.failureType
      ?? getAiProviderFailureCategory(error.statusCode, error.providerErrorCode);
    if (category === 'quota_exhausted') return 'Quota Exhausted';
    if (category === 'rate_limited') return 'Rate Limited';
    if (category === 'invalid_key') return 'Invalid Key';
    if (category === 'permission') return 'Permission Error';
    if (category === 'not_found') return 'Not Found';
    if (category === 'timeout') return 'Timeout';
    if (category === 'provider' || category === 'network') return 'Unavailable';
    return 'Unknown';
  }
  if (error instanceof TypeError) return 'Unavailable';
  return 'Unknown';
}

async function checkKey(provider: AiProvider, timeoutMs: number): Promise<void> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AiProviderError('Health check timed out', undefined, undefined, 'timeout'));
      controller.abort();
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      provider.generate(healthCheckPayload, controller.signal),
      timeoutPromise,
    ]);
    if (!response.content?.trim()) {
      throw new AiProviderError('Health check returned an empty response', undefined, undefined, 'provider');
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function checkAiProvidersHealth(
  providers: AiProvider[],
  options: { timeoutMs?: number; now?: () => number } = {},
): Promise<AiProviderHealthResult[]> {
  const timeoutMs = options.timeoutMs ?? HEALTH_CHECK_TIMEOUT_MS;
  const now = options.now ?? Date.now;
  const byName = new Map<AiProviderName, AiProvider[]>();
  providers.forEach((provider) => {
    const keys = byName.get(provider.name) ?? [];
    keys.push(provider);
    byName.set(provider.name, keys);
  });

  return Promise.all(AI_PROVIDER_NAMES.map(async (name) => {
    const keys = byName.get(name) ?? [];
    const configured = keys.length > 0;
    const checkedAt = configured ? new Date(now()).toISOString() : null;
    const start = now();
    let status: AiProviderHealthStatus = 'Unknown';
    let httpStatus: number | null = null;
    let failureReason: string | null = null;
    let failureCategory: AiProviderFailureCategory | undefined;
    let providerErrorCode: AiProviderError['providerErrorCode'];

    if (configured && keys.length > 0) {
      const failures: unknown[] = [];
      status = 'Unavailable';
      for (const provider of keys) {
        try {
          await checkKey(provider, timeoutMs);
          status = 'Healthy';
          break;
        } catch (error) {
          failures.push(error);
          status = classifyFailure(error);
          if (error instanceof AiProviderError) {
            httpStatus = error.statusCode ?? null;
            failureReason = error.statusCode
              ? `HTTP_${error.statusCode}`
              : error.failureType === 'timeout'
                ? 'timeout'
                : error.message.includes('empty response')
                  ? 'empty_response'
                  : error.message.includes('invalid response body')
                    ? 'invalid_response'
                    : 'provider_error';
            failureCategory = error.failureType
              ?? getAiProviderFailureCategory(error.statusCode, error.providerErrorCode);
            providerErrorCode = error.providerErrorCode;
          } else if (error instanceof TypeError) {
            failureReason = 'network_error';
            failureCategory = 'network';
          } else {
            failureReason = 'unknown_error';
            failureCategory = 'unknown';
          }
        }
      }

      if (status !== 'Healthy' && failures.length > 1) {
        const classified = failures.map(classifyFailure);
        if (classified.every((failure) => failure === 'Quota Exhausted')) status = 'Quota Exhausted';
        else if (classified.every((failure) => failure === 'Rate Limited')) status = 'Rate Limited';
        else if (classified.every((failure) => failure === 'Invalid Key')) status = 'Invalid Key';
        else if (classified.every((failure) => failure === 'Timeout')) status = 'Timeout';
        else if (classified.every((failure) => failure === 'Unknown')) status = 'Unknown';
        else status = 'Unavailable';
      }
      if (status === 'Healthy') {
        failureCategory = undefined;
        providerErrorCode = undefined;
        failureReason = null;
      }
    }

    const result: AiProviderHealthResult = {
      provider: name,
      configuration: configured ? 'Configured' : 'Not Configured',
      status,
      httpStatus,
      failureReason,
      failureCategory,
      providerErrorCode,
      lastCheckedAt: checkedAt,
      durationMs: configured ? Math.max(0, now() - start) : null,
      fallbackAvailable: name !== 'gemini' && status === 'Healthy',
    };
    if (configured) lastHealthChecks.set(name, result);
    return result;
  }));
}

export function getLastAiProviderHealthChecks(): AiProviderHealthResult[] {
  const runtimeStatus = getAiProviderRuntimeStatus();
  return AI_PROVIDER_NAMES.map((provider) => {
    const lastCheck = lastHealthChecks.get(provider);
    if (lastCheck) return lastCheck;

    return {
      provider,
      configuration: runtimeStatus[provider].ready ? 'Configured' : 'Not Configured',
      status: 'Unknown',
      httpStatus: null,
      failureReason: null,
      failureCategory: undefined,
      providerErrorCode: undefined,
      lastCheckedAt: null,
      durationMs: null,
      fallbackAvailable: false,
    };
  });
}
