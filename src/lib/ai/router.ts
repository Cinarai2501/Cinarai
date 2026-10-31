import { GeminiProvider } from './gemini';
import { GroqProvider } from './groq';
import { OpenRouterProvider } from './openrouter';
import { OpenAIProvider } from './openai';
import type { AiProvider, AiProviderConfig, AiProviderName, AiRequestPayload, AiResponse } from './provider';

const PROVIDER_TIMEOUT_MS = 8_000;
const GLOBAL_TIMEOUT_MS = 35_000;

const PROVIDER_ENV_KEYS: Record<AiProviderName, string> = {
  gemini: 'GEMINI_API_KEY',
  groq: 'GROQ_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
};

const PROVIDER_DISPLAY_NAMES: Record<AiProviderName, string> = {
  gemini: 'Gemini',
  groq: 'Groq',
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
};

export interface AiRouterLogEntry {
  provider: AiProviderName;
  status: 'success' | 'failed';
  reason?: string;
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

class ProviderTimeoutError extends Error {}
class GlobalDeadlineError extends Error {}

export class AiRouter {
  constructor(
    private readonly providers: AiProvider[],
    private readonly logger: Pick<Console, 'info' | 'warn' | 'error'> = console,
    private readonly timeoutMs: number = PROVIDER_TIMEOUT_MS,
    private readonly globalTimeoutMs: number = GLOBAL_TIMEOUT_MS,
  ) {}

  static createDefault(configs: Partial<Record<AiProviderName, AiProviderConfig>> = {}): AiRouter {
    const providers: AiProvider[] = [
      this.createProviderIfConfigured('gemini', configs.gemini),
      this.createProviderIfConfigured('openai', configs.openai),
      this.createProviderIfConfigured('groq', configs.groq),
      this.createProviderIfConfigured('openrouter', configs.openrouter),
    ].filter((provider): provider is AiProvider => Boolean(provider));

    return new AiRouter(providers);
  }

  private static createProviderIfConfigured(
    providerName: AiProviderName,
    config?: AiProviderConfig,
  ): AiProvider | null {
    const envKey = PROVIDER_ENV_KEYS[providerName];
    const configuredKey = config?.apiKey ?? process.env[envKey]?.trim();

    if (!configuredKey) {
      return null;
    }

    const providerConfig = { ...config, apiKey: configuredKey };

    switch (providerName) {
      case 'gemini':
        return new GeminiProvider(providerConfig);
      case 'groq':
        return new GroqProvider(providerConfig);
      case 'openrouter':
        return new OpenRouterProvider(providerConfig);
      case 'openai':
        return new OpenAIProvider(providerConfig);
    }
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
    const deadline = Date.now() + this.globalTimeoutMs;

    if (this.providers.length === 0) {
      this.logger.error('[ai-router] No AI providers configured.');
      this.logger.error('[ai-router] Checked environment variables: GEMINI_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY');
      throw new AiRouterError('Seluruh layanan AI sedang tidak tersedia.', logs);
    }

    for (const [index, provider] of this.providers.entries()) {
      const remainingMs = deadline - Date.now();
      if (remainingMs <= 0) {
        throw new AiRouterTimeoutError(logs);
      }

      const displayName = PROVIDER_DISPLAY_NAMES[provider.name] ?? provider.name;
      const providerLabel = displayName;
      this.logger.info(`[AI Router] router -> ${providerLabel}`);
      this.logger.info(`[AI Router] Trying ${providerLabel}...`);

      const startMs = Date.now();
      const providerTimeoutMs = Math.min(this.timeoutMs, remainingMs);
      const globalDeadlineApplies = remainingMs <= this.timeoutMs;

      try {
        const response = await this.generateWithTimeout(
          provider,
          payload,
          providerTimeoutMs,
          globalDeadlineApplies,
        );
        if (Date.now() >= deadline) {
          logs.push({
            provider: provider.name,
            status: 'failed',
            reason: `Global deadline exceeded after ${this.globalTimeoutMs}ms`,
          });
          throw new AiRouterTimeoutError(logs);
        }
        if (!response?.content?.trim()) {
          throw new Error(`Provider ${provider.name} returned empty content`);
        }

        logs.push({ provider: provider.name, status: 'success' });
        this.logger.info(`[AI Router] Provider = ${providerLabel}`);
        this.logger.info('[AI Router] Status = success');
        this.logger.info(`[AI Router] Provider used = ${providerLabel}`);
        this.logger.info(`[AI Router] Response length = ${response.content.length}`);
        this.logger.info(`[AI Router] router returned provider: ${providerLabel}`);
        return response;
      } catch (error) {
        if (error instanceof AiRouterTimeoutError) {
          throw error;
        }

        const elapsedMs = Date.now() - startMs;
        const reason = error instanceof Error ? error.message : 'unknown error';
        const isGlobalTimeout = error instanceof GlobalDeadlineError;
        const globalDeadlineReached = isGlobalTimeout || Date.now() >= deadline;
        const isTimeout = globalDeadlineReached || error instanceof ProviderTimeoutError;
        const statusCode = typeof (error as { statusCode?: unknown }).statusCode === 'number'
          ? (error as { statusCode: number }).statusCode
          : undefined;

        const failureReason = globalDeadlineReached
          ? `Global deadline exceeded after ${this.globalTimeoutMs}ms`
          : reason;
        logs.push({ provider: provider.name, status: 'failed', reason: failureReason });

        if (isTimeout) {
          this.logger.warn(`[AI Router] Provider = ${providerLabel}`);
          this.logger.warn(`[AI Router] Elapsed = ${elapsedMs}ms`);
          this.logger.warn(`[AI Router] Reason = Timeout`);
          this.logger.warn(globalDeadlineReached
            ? `[AI Router] Global timeout after ${this.globalTimeoutMs}ms`
            : `[AI Router] Timeout after ${providerTimeoutMs}ms`);
        } else {
          this.logger.error(`[AI Router] Provider = ${providerLabel}`);
          this.logger.error('[AI Router] Status = failed');
          this.logger.error(`[AI Router] HTTP Status = ${statusCode ?? 'n/a'}`);
          this.logger.error(`[AI Router] Message = ${reason}`);
          this.logger.error(error);
        }

        if (globalDeadlineReached) {
          throw new AiRouterTimeoutError(logs);
        }

        const nextProvider = this.providers[index + 1];
        if (nextProvider) {
          const nextLabel = PROVIDER_DISPLAY_NAMES[nextProvider.name] ?? nextProvider.name;
          this.logger.info(`[AI Router] Switching to ${nextLabel}...`);
        }
      }
    }

    this.logger.error('[AI Router] All providers failed.');

    throw new AiRouterError('Seluruh layanan AI sedang tidak tersedia.', logs);
  }
}
