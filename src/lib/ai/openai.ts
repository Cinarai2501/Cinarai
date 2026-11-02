import { AiProviderError, createAiProviderHttpError } from './provider';
import type { AiProvider, AiProviderConfig, AiRequestPayload, AiResponse } from './provider';

export class OpenAIProvider implements AiProvider {
  public readonly name = 'openai' as const;

  constructor(private readonly config: AiProviderConfig = {}) {}

  async generate(payload: AiRequestPayload, signal?: AbortSignal): Promise<AiResponse> {
    const apiKey = this.config.apiKey?.trim();
    console.warn('[AI Provider] Trying OpenAI...');
    if (!apiKey) {
      throw new AiProviderError('OpenAI API key is not configured');
    }

    try {
      console.warn('[AI Provider] Request sent');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model: this.config.model ?? 'gpt-4o-mini',
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
          choices?: Array<{ message?: { content?: string } }>;
        };
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new AiProviderError('OpenAI returned an invalid response body', undefined, undefined, 'provider');
        }
        throw error;
      }

      console.warn('[AI Provider] Parsing Result = success');
      const parsed = data as { choices?: Array<{ message?: { content?: string } }> };
      const content = parsed.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new AiProviderError('OpenAI returned an empty response', undefined, undefined, 'provider');
      }

      console.warn('[AI Provider] Success');
      return {
        provider: this.name,
        content,
        raw: parsed,
      };
    } catch (error) {
      console.error('[AI Provider] OpenAI request failed');
      throw error;
    }
  }
}
