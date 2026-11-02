import type { AiProviderName } from './provider';

type ProviderStatus = {
  ready: boolean;
  keyCount: number;
  reason: string;
};

const PROVIDER_ENV_KEYS: Record<AiProviderName, string> = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  groq: 'GROQ_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
};

function getProviderStatus(provider: AiProviderName): ProviderStatus {
  const envKey = PROVIDER_ENV_KEYS[provider];
  const keyCount = Object.entries(process.env).filter(([name, value]) =>
    new RegExp(`^${envKey}(?:_\\d+)?$`).test(name) && Boolean(value?.trim())
  ).length;

  if (keyCount === 0) {
    return {
      ready: false,
      keyCount,
      reason: `Missing ${envKey} in this runtime.`,
    };
  }

  return {
    ready: true,
    keyCount,
    reason: `${keyCount} API key(s) configured for ${provider}.`,
  };
}

export function getAiProviderRuntimeStatus() {
  return {
    gemini: getProviderStatus('gemini'),
    openai: getProviderStatus('openai'),
    groq: getProviderStatus('groq'),
    openrouter: getProviderStatus('openrouter'),
  };
}

export const AI_PROVIDER_NAMES: AiProviderName[] = ['gemini', 'groq', 'openrouter', 'openai'];

export function logAiProviderStartupStatus(): void {
  const status = getAiProviderRuntimeStatus();

  console.warn('[AI Providers]');
  console.warn(`Gemini: ${status.gemini.ready ? `READY (${status.gemini.keyCount} keys)` : 'NOT READY'}`);
  console.warn(`OpenAI: ${status.openai.ready ? `READY (${status.openai.keyCount} keys)` : 'NOT READY'}`);
  console.warn(`Groq: ${status.groq.ready ? `READY (${status.groq.keyCount} keys)` : 'NOT READY'}`);
  console.warn(`OpenRouter: ${status.openrouter.ready ? `READY (${status.openrouter.keyCount} keys)` : 'NOT READY'}`);
}
