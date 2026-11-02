import { createHash } from 'node:crypto';
import { GeminiProvider } from './gemini';
import { GroqProvider } from './groq';
import { OpenRouterProvider } from './openrouter';
import { OpenAIProvider } from './openai';
import { AiProviderError, getAiProviderFailureCategory } from './provider';
import type {
  AiProvider,
  AiProviderConfig,
  AiProviderFailureCategory,
  AiProviderName,
  AiRequestPayload,
  AiResponse,
} from './provider';

const PROVIDER_TIMEOUT_MS = 8_000;
const GLOBAL_TIMEOUT_MS = 35_000;

const PROVIDER_ENV_KEYS: Record<AiProviderName, string> = {
  gemini: 'GEMINI_API_KEY',
  groq: 'GROQ_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
};

const MAX_TEMPORARY_BACKOFF_MS = 60_000;
const MAX_RATE_LIMIT_BACKOFF_MS = 5 * 60_000;
const MAX_QUOTA_BACKOFF_MS = 6 * 60 * 60_000;
const configuredProviderKeyIds = new WeakMap<AiProvider, string>();
const sharedKeyStates = new Map<string, ProviderKeyState>();
const sharedRoundRobinCursors = new Map<string, number>();

export type AiProviderKeyStatus =
  | 'AVAILABLE'
  | 'RATE_LIMITED'
  | 'QUOTA_EXHAUSTED'
  | 'TEMPORARILY_UNAVAILABLE'
  | 'INVALID_KEY';

type ProviderKeyState = {
  status: AiProviderKeyStatus;
  failureCount: number;
  retryAt: number;
  failureType?: AiProviderFailureCategory;
  statusCode?: number;
};

type ProviderGroup = {
  name: AiProviderName;
  keys: AiProvider[];
};

const PROVIDER_DISPLAY_NAMES: Record<AiProviderName, string> = {
  gemini: 'Gemini',
  groq: 'Groq',
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
};
const PROVIDER_PRIORITY: Record<AiProviderName, number> = {
  gemini: 0,
  groq: 1,
  openrouter: 2,
  openai: 3,
};

export interface AiRouterLogEntry {
  provider: AiProviderName;
  status: 'success' | 'failed';
  reason?: string;
  failureCategory?: AiProviderFailureCategory;
}

type AiFailureCategory = NonNullable<AiRouterLogEntry['failureCategory']>;

function getFailureCategory(error: unknown): AiFailureCategory {
  if (error instanceof AiProviderError) {
    return error.failureType ?? getAiProviderFailureCategory(error.statusCode, error.providerErrorCode);
  }
  if (error instanceof ProviderTimeoutError || error instanceof GlobalDeadlineError) return 'timeout';
  if (error instanceof TypeError) return 'network';
  return 'unknown';
}

export class AiRouterError extends Error {
  constructor(
    message: string,
    public readonly logs: AiRouterLogEntry[],
  ) {
    super(message);
    this.name = 'AiRouterError';
  }
}

export class AiRouterTimeoutError extends AiRouterError {
  constructor(logs: AiRouterLogEntry[]) {
    super('Batas waktu keseluruhan analisis AI terlampaui.', logs);
    this.name = 'AiRouterTimeoutError';
  }
}

export class AiRouterNonRetryableError extends AiRouterError {
  constructor(logs: AiRouterLogEntry[]) {
    super('Permintaan AI tidak valid untuk provider.', logs);
    this.name = 'AiRouterNonRetryableError';
  }
}

class ProviderTimeoutError extends Error {}
class GlobalDeadlineError extends Error {}

export class AiRouter {
  private readonly groups: ProviderGroup[];
  private readonly keyStates = new WeakMap<AiProvider, ProviderKeyState>();
  private readonly nextKeyIndexes = new Map<AiProviderName, number>();

  constructor(
    readonly providers: AiProvider[],
    private readonly logger: Pick<Console, 'info' | 'warn' | 'error'> = console,
    private readonly timeoutMs: number = PROVIDER_TIMEOUT_MS,
    private readonly globalTimeoutMs: number = GLOBAL_TIMEOUT_MS,
  ) {
    const groups = new Map<AiProviderName, AiProvider[]>();
    providers.forEach((provider) => {
      const keys = groups.get(provider.name) ?? [];
      keys.push(provider);
      groups.set(provider.name, keys);
      this.keyStates.set(provider, { status: 'AVAILABLE', failureCount: 0, retryAt: 0 });
    });
    this.groups = [...groups]
      .map(([name, keys]) => ({ name, keys }))
      .sort((left, right) => PROVIDER_PRIORITY[left.name] - PROVIDER_PRIORITY[right.name]);
  }

  static createDefault(configs: Partial<Record<AiProviderName, AiProviderConfig>> = {}): AiRouter {
    const providers: AiProvider[] = ([
      'gemini',
      'groq',
      'openrouter',
      'openai',
    ] as const).flatMap((name) => this.createProvidersIfConfigured(name, configs[name]));

    return new AiRouter(providers);
  }

  private static createProvidersIfConfigured(
    providerName: AiProviderName,
    config?: AiProviderConfig,
  ): AiProvider[] {
    const envKey = PROVIDER_ENV_KEYS[providerName];
    const keys = config?.apiKeys
      ? config.apiKeys
      : config?.apiKey !== undefined
        ? [config.apiKey]
        : Object.entries(process.env)
          .flatMap(([name, value]) => {
            const match = name.match(new RegExp(`^${envKey}(?:_(\\d+))?$`));
            if (!match || !value?.trim()) return [];
            return [{ index: match[1] ? Number(match[1]) : 1, key: value.trim() }];
          })
          .sort((left, right) => left.index - right.index)
          .map(({ key }) => key);
    const uniqueKeys = [...new Set(keys.map((key) => key.trim()).filter(Boolean))];
    return uniqueKeys.map((apiKey) => {
      const providerConfig = { ...config, apiKey, apiKeys: undefined };
      let provider: AiProvider;
      switch (providerName) {
        case 'gemini':
          provider = new GeminiProvider(providerConfig);
          break;
        case 'groq':
          provider = new GroqProvider(providerConfig);
          break;
        case 'openrouter':
          provider = new OpenRouterProvider(providerConfig);
          break;
        case 'openai':
          provider = new OpenAIProvider(providerConfig);
          break;
      }
      const keyId = createHash('sha256').update(`${providerName}:${apiKey}`).digest('hex');
      configuredProviderKeyIds.set(provider, keyId);
      return provider;
    });
  }

  private async generateWithTimeout(
    provider: AiProvider,
    payload: AiRequestPayload,
    timeoutMs: number,
    globalDeadlineApplies: boolean,
  ): Promise<AiResponse> {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(globalDeadlineApplies
          ? new GlobalDeadlineError(`Global deadline exceeded after ${this.globalTimeoutMs}ms`)
          : new ProviderTimeoutError(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([provider.generate(payload, controller.signal), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async generate(payload: AiRequestPayload): Promise<AiResponse> {
    const logs: AiRouterLogEntry[] = [];
    const startedAt = Date.now();
    const deadline = Date.now() + this.globalTimeoutMs;
    const providersTried: AiProviderName[] = [];
    let keyAttemptCount = 0;

    if (this.groups.length === 0) {
      this.logger.error('[ai-router] No AI providers configured.');
      this.logger.error('[ai-router] Checked environment variables: GEMINI_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY');
      throw new AiRouterError('Seluruh layanan AI sedang tidak tersedia.', logs);
    }

    for (const [index, group] of this.groups.entries()) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        this.logRequestDiagnostics('failed', startedAt, providersTried, keyAttemptCount, logs);
        throw new AiRouterTimeoutError(logs);
      }

      const providerLabel = PROVIDER_DISPLAY_NAMES[group.name] ?? group.name;
      providersTried.push(group.name);
      this.logger.info(`[AI Router] router -> ${providerLabel}`);
      try {
        const groupDeadline = Math.min(
          deadline,
          Date.now() + Math.max(1, Math.floor(remainingMs / (this.groups.length - index))),
        );
        const { response, keyFallbackUsed } = await this.generateWithProviderKeys(
          group,
          payload,
          groupDeadline,
          deadline,
          logs,
          () => {
            keyAttemptCount += 1;
          },
        );
        logs.push({ provider: group.name, status: 'success' });
        this.logRequestDiagnostics('success', startedAt, providersTried, keyAttemptCount, logs, {
          successfulProvider: group.name,
          keyFallbackUsed,
          providerFallbackUsed: index > 0,
        });
        return { ...response, fallbackUsed: index > 0 || keyFallbackUsed };
      } catch (error) {
        if (error instanceof AiRouterTimeoutError) {
          logs.push({
            provider: group.name,
            status: 'failed',
            reason: `Timeout after ${this.globalTimeoutMs}ms`,
            failureCategory: 'timeout',
          });
          this.logRequestDiagnostics('failed', startedAt, providersTried, keyAttemptCount, logs);
          throw error;
        }

        if (error instanceof AiRouterNonRetryableError) {
          logs.push({
            provider: group.name,
            status: 'failed',
            reason: 'Non-retryable provider error',
            failureCategory: 'unknown',
          });
          this.logRequestDiagnostics('failed', startedAt, providersTried, keyAttemptCount, logs);
          throw error;
        }

        const statusCode = error instanceof AiProviderError ? error.statusCode : undefined;
        const reason = error instanceof AiProviderError && error.failureReasons?.length
          ? error.failureReasons.join(', ')
          : error instanceof ProviderTimeoutError
            || (error instanceof AiProviderError && error.failureType === 'timeout')
            ? `Timeout after ${this.timeoutMs}ms`
            : statusCode ? `HTTP ${statusCode}` : 'Provider request failed';
        logs.push({
          provider: group.name,
          status: 'failed',
          reason,
          failureCategory: getFailureCategory(error),
        });
        this.logger.warn(`[AI Router] Provider failed; provider=${providerLabel}; reason=${reason}`);

        const nextProvider = this.groups[index + 1];
        if (nextProvider) {
          const nextLabel = PROVIDER_DISPLAY_NAMES[nextProvider.name] ?? nextProvider.name;
          this.logger.info(`[AI Router] Switching to ${nextLabel}...`);
        }
      }
    }

    this.logger.error('[AI Router] All providers failed.');
    this.logRequestDiagnostics('failed', startedAt, providersTried, keyAttemptCount, logs);
    throw new AiRouterError('Seluruh layanan AI sedang tidak tersedia.', logs);
  }

  private logRequestDiagnostics(
    status: 'success' | 'failed',
    startedAt: number,
    providersTried: AiProviderName[],
    keyAttemptCount: number,
    failures: AiRouterLogEntry[],
    result?: {
      successfulProvider: AiProviderName;
      keyFallbackUsed: boolean;
      providerFallbackUsed: boolean;
    },
  ): void {
    this.logger.info('[AI Router] Request diagnostics', {
      status,
      successfulProvider: result?.successfulProvider ?? null,
      firstProviderAttempted: providersTried[0] ?? null,
      keyFallbackUsed: result?.keyFallbackUsed ?? false,
      providerFallbackUsed: result?.providerFallbackUsed ?? false,
      providerCountTried: providersTried.length,
      providersTried: [...providersTried],
      keyAttemptCount,
      previousProviderFailures: failures
        .filter((entry) => entry.status === 'failed')
        .map(({ provider, reason, failureCategory }) => ({ provider, reason, failureCategory })),
      providerTransitions: failures
        .filter((entry) => entry.status === 'failed')
        .flatMap((entry) => {
          const nextProvider = providersTried[providersTried.indexOf(entry.provider) + 1];
          return nextProvider
            ? [{
              from: entry.provider,
              to: nextProvider,
              reason: entry.reason,
              failureCategory: entry.failureCategory,
            }]
            : [];
        }),
      totalDurationMs: Date.now() - startedAt,
    });
  }

  private getKeyState(provider: AiProvider): ProviderKeyState {
    const keyId = configuredProviderKeyIds.get(provider);
    if (keyId) {
      let sharedState = sharedKeyStates.get(keyId);
      if (!sharedState) {
        sharedState = { status: 'AVAILABLE', failureCount: 0, retryAt: 0 };
        sharedKeyStates.set(keyId, sharedState);
      }
      return sharedState;
    }
    let state = this.keyStates.get(provider);
    if (!state) {
      state = { status: 'AVAILABLE', failureCount: 0, retryAt: 0 };
      this.keyStates.set(provider, state);
    }
    return state;
  }

  private getCandidateIndexes(group: ProviderGroup): number[] {
    const keyIds = group.keys.map((provider) => configuredProviderKeyIds.get(provider));
    const cursorKey = keyIds.every(Boolean) ? `${group.name}:${keyIds.join(':')}` : null;
    const start = cursorKey
      ? sharedRoundRobinCursors.get(cursorKey) ?? 0
      : this.nextKeyIndexes.get(group.name) ?? 0;
    if (cursorKey) sharedRoundRobinCursors.set(cursorKey, (start + 1) % group.keys.length);
    else this.nextKeyIndexes.set(group.name, (start + 1) % group.keys.length);
    const candidates: number[] = [];
    for (let offset = 0; offset < group.keys.length; offset += 1) {
      const index = (start + offset) % group.keys.length;
      const state = this.getKeyState(group.keys[index]);
      if (state.status !== 'INVALID_KEY' && state.retryAt <= Date.now()) {
        if (state.status !== 'AVAILABLE') {
          state.status = 'AVAILABLE';
          state.retryAt = 0;
          state.failureType = undefined;
          state.statusCode = undefined;
        }
        candidates.push(index);
      }
    }
    return candidates;
  }

  private async generateWithProviderKeys(
    group: ProviderGroup,
    payload: AiRequestPayload,
    groupDeadline: number,
    globalDeadline: number,
    logs: AiRouterLogEntry[],
    onKeyAttempt: () => void,
  ): Promise<{ response: AiResponse; keyFallbackUsed: boolean }> {
    const candidateIndexes = this.getCandidateIndexes(group);
    const keyFailureReasons: string[] = [];
    if (!candidateIndexes.length) {
      const states = group.keys.map((provider) => this.getKeyState(provider));
      const invalid = states.every((state) => state.status === 'INVALID_KEY');
      const allTimedOut = states.every(
        (state) => state.status === 'TEMPORARILY_UNAVAILABLE' && state.failureType === 'timeout',
      );
      const retryAt = Math.min(...states
        .filter((state) => state.status !== 'INVALID_KEY')
        .map((state) => state.retryAt));
      const failureReasons = states.map((state) => state.failureType ?? state.status);
      const statusCode = invalid ? 401
        : states.some((state) => state.status === 'RATE_LIMITED' || state.status === 'QUOTA_EXHAUSTED') ? 429
          : states.find((state) => state.statusCode)?.statusCode ?? 503;
      throw new AiProviderError(
        `All API keys for ${group.name} are unavailable`,
        statusCode,
        Number.isFinite(retryAt) ? Math.max(0, retryAt - Date.now()) : undefined,
        allTimedOut ? 'timeout' : states.find((state) => state.failureType)?.failureType,
        failureReasons,
      );
    }

    for (const [attemptIndex, keyIndex] of candidateIndexes.entries()) {
      const provider = group.keys[keyIndex];
      const state = this.getKeyState(provider);
      const remainingMs = Math.min(groupDeadline, globalDeadline) - Date.now();
      if (remainingMs <= 0) {
        if (Date.now() >= globalDeadline) throw new AiRouterTimeoutError(logs);
        break;
      }
      const remainingKeys = candidateIndexes.length - attemptIndex;
      const providerTimeoutMs = Math.min(this.timeoutMs, Math.max(1, Math.floor(remainingMs / remainingKeys)));
      const startMs = Date.now();
      onKeyAttempt();
      this.logger.info(`[AI Router] Trying ${group.name} key ${keyIndex + 1} of ${group.keys.length}`);

      try {
        const response = await this.generateWithTimeout(
          provider,
          payload,
          providerTimeoutMs,
          groupDeadline === globalDeadline && Date.now() + providerTimeoutMs >= globalDeadline,
        );
        if (Date.now() >= globalDeadline) throw new AiRouterTimeoutError(logs);
        if (!response?.content?.trim()) throw new Error('Provider returned empty content');
        state.status = 'AVAILABLE';
        state.failureCount = 0;
        state.retryAt = 0;
        state.failureType = undefined;
        return {
          response,
          keyFallbackUsed: attemptIndex > 0 || candidateIndexes.length < group.keys.length,
        };
      } catch (error) {
        if (error instanceof AiRouterTimeoutError) {
          throw error;
        }
        if (error instanceof GlobalDeadlineError || Date.now() >= globalDeadline) {
          state.status = 'TEMPORARILY_UNAVAILABLE';
          state.failureType = 'timeout';
          logs.push({
            provider: group.name,
            status: 'failed',
            reason: `Timeout after ${this.timeoutMs}ms`,
            failureCategory: 'timeout',
          });
          throw new AiRouterTimeoutError(logs);
        }
        const statusCode = error instanceof AiProviderError ? error.statusCode : undefined;
        let failureReason: string;
        if (statusCode === 401) {
          failureReason = 'HTTP 401';
          state.status = 'INVALID_KEY';
          state.retryAt = Number.POSITIVE_INFINITY;
          state.failureType = undefined;
          state.statusCode = statusCode;
        } else if (statusCode === 429) {
          const failureType = error instanceof AiProviderError
            ? getAiProviderFailureCategory(statusCode, error.providerErrorCode)
            : 'rate_limited';
          failureReason = failureType === 'quota_exhausted' ? 'HTTP 429 (quota exhausted)' : 'HTTP 429 (rate limited)';
          state.status = failureType === 'quota_exhausted' ? 'QUOTA_EXHAUSTED' : 'RATE_LIMITED';
          state.failureCount += 1;
          state.failureType = failureType;
          state.statusCode = statusCode;
          const backoff = failureType === 'quota_exhausted'
            ? Math.min(MAX_QUOTA_BACKOFF_MS, 5 * 60_000 * 2 ** (state.failureCount - 1))
            : Math.min(MAX_RATE_LIMIT_BACKOFF_MS, 1_000 * 2 ** (state.failureCount - 1));
          const retryAfterMs = error instanceof AiProviderError ? error.retryAfterMs : undefined;
          state.retryAt = Date.now() + (retryAfterMs ?? backoff);
        } else if (statusCode === 403 || statusCode === 404) {
          const failureType = error instanceof AiProviderError
            ? getAiProviderFailureCategory(statusCode, error.providerErrorCode)
            : 'unknown';
          failureReason = statusCode === 403 ? 'HTTP 403 (permission/access error)' : 'HTTP 404 (endpoint/model unavailable)';
          state.status = 'TEMPORARILY_UNAVAILABLE';
          state.failureCount += 1;
          state.failureType = failureType;
          state.statusCode = statusCode;
          state.retryAt = Date.now() + Math.min(MAX_TEMPORARY_BACKOFF_MS, 1_000 * 2 ** (state.failureCount - 1));
          keyFailureReasons.push(failureReason);
          throw new AiProviderError(
            `Provider ${group.name} returned HTTP ${statusCode}`,
            statusCode,
            undefined,
            failureType,
            [failureReason],
            error instanceof AiProviderError ? error.providerErrorCode : undefined,
          );
        } else if (error instanceof ProviderTimeoutError
          || (statusCode !== undefined && statusCode >= 500)
          || error instanceof TypeError
          || (error instanceof AiProviderError && error.failureType !== undefined
            && error.failureType !== 'invalid_key'
            && error.failureType !== 'permission'
            && error.failureType !== 'not_found'
            && error.failureType !== 'quota_exhausted'
            && error.failureType !== 'rate_limited')) {
          state.status = 'TEMPORARILY_UNAVAILABLE';
          state.failureCount += 1;
          failureReason = error instanceof ProviderTimeoutError
            ? `Timeout after ${this.timeoutMs}ms`
            : error instanceof TypeError ? 'Network error' : statusCode ? `HTTP ${statusCode}` : 'Invalid provider response';
          state.failureType = error instanceof ProviderTimeoutError
            ? 'timeout'
            : error instanceof TypeError ? 'network'
              : error instanceof AiProviderError ? error.failureType : 'provider';
          state.statusCode = statusCode;
          const backoff = Math.min(MAX_TEMPORARY_BACKOFF_MS, 1_000 * 2 ** (state.failureCount - 1));
          state.retryAt = Date.now() + backoff;
        } else {
          throw new AiRouterNonRetryableError(logs);
        }
        keyFailureReasons.push(failureReason);
        const elapsedMs = Date.now() - startMs;
        if (error instanceof ProviderTimeoutError) {
          this.logger.warn(`[AI Router] Provider = ${PROVIDER_DISPLAY_NAMES[group.name]}`);
          this.logger.warn(`[AI Router] Elapsed = ${elapsedMs}ms`);
          this.logger.warn('[AI Router] Reason = Timeout');
        } else {
          this.logger.warn(
            `[AI Router] Key unavailable; provider=${group.name}; status=${statusCode ?? 'network'}; elapsed=${elapsedMs}ms`,
          );
        }
      }
    }

    const states = group.keys.map((provider) => this.getKeyState(provider));
    const invalid = states.every((state) => state.status === 'INVALID_KEY');
    const allTimedOut = states.every(
      (state) => state.status === 'TEMPORARILY_UNAVAILABLE' && state.failureType === 'timeout',
    );
    const retryAt = Math.min(...states
      .filter((state) => state.status !== 'INVALID_KEY')
      .map((state) => state.retryAt));
    const statusCode = invalid ? 401
      : states.some((state) => state.status === 'QUOTA_EXHAUSTED' || state.status === 'RATE_LIMITED') ? 429
        : states.find((state) => state.statusCode)?.statusCode ?? 503;
    throw new AiProviderError(
      `All API keys for ${group.name} failed`,
      statusCode,
      Number.isFinite(retryAt) ? Math.max(0, retryAt - Date.now()) : undefined,
      allTimedOut ? 'timeout' : states.find((state) => state.failureType)?.failureType,
      keyFailureReasons.length ? keyFailureReasons : states.map((state) => state.status),
    );
  }
}
