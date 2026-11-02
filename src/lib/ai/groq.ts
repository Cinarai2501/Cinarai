import { AiProviderError, createAiProviderHttpError } from './provider';
import type { AiProvider, AiProviderConfig, AiRequestPayload, AiResponse } from './provider';

export class GroqProvider implements AiProvider {
  public readonly name = 'groq' as const;

  constructor(private readonly config: AiProviderConfig = {}) {}

  async generate(payload: AiRequestPayload, signal?: AbortSignal): Promise<AiResponse> {
    const apiKey = this.config.apiKey?.trim();
    console.warn('[AI Provider] Trying Groq...');
    if (!apiKey) {
      throw new AiProviderError('Groq API key is not configured');
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
      if (!response.ok) {
        throw createAiProviderHttpError(response, rawBody);
      }

      let data: unknown;
      try {
        data = JSON.parse(rawBody) as {
          choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
        };
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new AiProviderError('Groq returned an invalid response body', undefined, undefined, 'provider');
        }
        throw error;
      }

      console.warn('[AI Provider] Parsing Result = success');
      const parsed = data as { choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }> };
      const content = typeof parsed.choices?.[0]?.message?.content === 'string'
        ? parsed.choices[0].message.content
        : Array.isArray(parsed.choices?.[0]?.message?.content)
          ? parsed.choices[0].message.content.map((part) => part.text ?? '').join('')
          : '';

      if (!content?.trim()) {
        throw new AiProviderError('Groq returned an empty response', undefined, undefined, 'provider');
      }

      console.warn('[AI Provider] Success');
      return {
        provider: this.name,
        content,
        raw: parsed,
      };
    } catch (error) {
      console.error('[AI Provider] Groq request failed');
      throw error;
    }
  }
}
