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
  raw?: unknown;
}

export interface AiProvider {
  name: AiProviderName;
  generate(payload: AiRequestPayload, signal?: AbortSignal): Promise<AiResponse>;
}

export interface AiProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export function createAiProviderConfig(overrides: Partial<AiProviderConfig> = {}): AiProviderConfig {
  return {
    apiKey: overrides.apiKey,
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
