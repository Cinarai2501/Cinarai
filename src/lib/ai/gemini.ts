import { summarizeResponseBody } from './provider';
import type { AiProvider, AiProviderConfig, AiRequestPayload, AiResponse } from './provider';

function createProviderError(message: string, statusCode?: number): Error & { statusCode?: number } {
  const error = new Error(message) as Error & { statusCode?: number };
  if (typeof statusCode === 'number') {
    error.statusCode = statusCode;
  }
  return error;
}

export class GeminiProvider implements AiProvider {
  public readonly name = 'gemini' as const;

  constructor(private readonly config: AiProviderConfig = {}) {}

  async generate(payload: AiRequestPayload, signal?: AbortSignal): Promise<AiResponse> {
    const apiKey = this.config.apiKey?.trim();
    console.warn('[AI Provider] Trying Gemini...');
    console.warn(`[AI Provider] API Key = ${apiKey ? 'FOUND' : 'NOT FOUND'}`);

    if (!apiKey) {
      console.error('[AI Provider] Gemini failed: GEMINI_API_KEY is not configured');
      throw createProviderError('GEMINI_API_KEY is not configured');
    }

    try {
      console.warn('[AI Provider] Request sent');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model ?? 'gemini-2.0-flash'}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${payload.systemPrompt ? `${payload.systemPrompt}\n\n` : ''}${payload.prompt}` }],
              },
            ],
            generationConfig: {
              temperature: payload.temperature ?? 0.7,
              maxOutputTokens: payload.maxTokens ?? 220,
            },
          }),
        },
      );

      console.warn('[AI Provider] Response received');
      console.warn(`[AI Provider] Status Code = ${response.status}`);

      const rawBody = await response.text();
      console.warn(`[AI Provider] Response Body = ${summarizeResponseBody(rawBody)}`);

      if (!response.ok) {
        console.error(`[AI Provider] Gemini failed: ${rawBody}`);
        throw createProviderError(`HTTP ${response.status}: ${rawBody || response.statusText}`, response.status);
      }

      let data: unknown;
      try {
        data = JSON.parse(rawBody) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
      } catch (error) {
        console.error('[AI Provider] Gemini parsing failed', error);
        throw createProviderError(`Parsing failed. Expected response with candidates content. Actual response: ${summarizeResponseBody(rawBody)}`);
      }

      console.warn('[AI Provider] Parsing Result = success');
      const parsed = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const content = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();

      if (!content) {
        console.error('[AI Provider] Gemini failed: empty content after parsing');
        throw createProviderError(`Parsing failed. Expected response with text content. Actual response: ${summarizeResponseBody(parsed)}`);
      }

      console.warn('[AI Provider] Success');
      return {
        provider: this.name,
        content,
        raw: parsed,
      };
    } catch (error) {
      console.error('[AI Provider] Gemini failed', error);
      throw error;
    }
  }
}
