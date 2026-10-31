import { summarizeResponseBody } from './provider';
import type { AiProvider, AiProviderConfig, AiRequestPayload, AiResponse } from './provider';

function createProviderError(message: string, statusCode?: number): Error & { statusCode?: number } {
  const error = new Error(message) as Error & { statusCode?: number };
  if (typeof statusCode === 'number') {
    error.statusCode = statusCode;
  }
  return error;
}

export class GroqProvider implements AiProvider {
  public readonly name = 'groq' as const;

  constructor(private readonly config: AiProviderConfig = {}) {}

  async generate(payload: AiRequestPayload, signal?: AbortSignal): Promise<AiResponse> {
    const apiKey = this.config.apiKey?.trim();
    console.warn('[AI Provider] Trying Groq...');
    console.warn(`[AI Provider] API Key = ${apiKey ? 'FOUND' : 'NOT FOUND'}`);

    if (!apiKey) {
      console.error('[AI Provider] Groq failed: GROQ_API_KEY is not configured');
      throw createProviderError('GROQ_API_KEY is not configured');
    }

    try {
      console.warn('[AI Provider] Request sent');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model: this.config.model ?? 'llama-3.3-70b-versatile',
          temperature: payload.temperature ?? 0.7,
          max_tokens: payload.maxTokens ?? 220,
          messages: [
            ...(payload.systemPrompt ? [{ role: 'system', content: payload.systemPrompt }] : []),
            { role: 'user', content: payload.prompt },
          ],
        }),
      });

      console.warn('[AI Provider] Response received');
      console.warn(`[AI Provider] Status Code = ${response.status}`);

      const rawBody = await response.text();
      console.warn(`[AI Provider] Response Body = ${summarizeResponseBody(rawBody)}`);

      if (!response.ok) {
        console.error(`[AI Provider] Groq failed: ${rawBody}`);
        throw createProviderError(`HTTP ${response.status}: ${rawBody || response.statusText}`, response.status);
      }

      let data: unknown;
      try {
        data = JSON.parse(rawBody) as {
          choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
        };
      } catch (error) {
        console.error('[AI Provider] Groq parsing failed', error);
        throw createProviderError(`Parsing failed. Expected response with chat completion. Actual response: ${summarizeResponseBody(rawBody)}`);
      }

      console.warn('[AI Provider] Parsing Result = success');
      const parsed = data as { choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }> };
      const content = typeof parsed.choices?.[0]?.message?.content === 'string'
        ? parsed.choices[0].message.content
        : Array.isArray(parsed.choices?.[0]?.message?.content)
          ? parsed.choices[0].message.content.map((part) => part.text ?? '').join('')
          : '';

      if (!content?.trim()) {
        console.error('[AI Provider] Groq failed: empty content after parsing');
        throw createProviderError(`Parsing failed. Expected response with text content. Actual response: ${summarizeResponseBody(parsed)}`);
      }

      console.warn('[AI Provider] Success');
      return {
        provider: this.name,
        content,
        raw: parsed,
      };
    } catch (error) {
      console.error('[AI Provider] Groq failed', error);
      throw error;
    }
  }
}
