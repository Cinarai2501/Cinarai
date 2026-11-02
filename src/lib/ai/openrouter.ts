import { AiProviderError, createAiProviderHttpError } from './provider';
import type { AiProvider, AiProviderConfig, AiRequestPayload, AiResponse } from './provider';

export class OpenRouterProvider implements AiProvider {
  public readonly name = 'openrouter' as const;

  constructor(private readonly config: AiProviderConfig = {}) {}

  async generate(payload: AiRequestPayload, signal?: AbortSignal): Promise<AiResponse> {
    const apiKey = this.config.apiKey?.trim();
    console.warn('[AI Provider] Trying OpenRouter...');
    if (!apiKey) {
      throw new AiProviderError('OpenRouter API key is not configured');
    }

    try {
      console.warn('[AI Provider] Request sent');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://cinarai.app',
          'X-Title': 'Cinarai',
        },
        signal,
        body: JSON.stringify({
          model: this.config.model ?? 'openai/gpt-4o-mini',
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
          throw new AiProviderError('OpenRouter returned an invalid response body', undefined, undefined, 'provider');
        }
        throw error;
      }

      console.warn('[AI Provider] Parsing Result = success');
      const parsed = data as { choices?: Array<{ message?: { content?: string } }> };
      const content = parsed.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new AiProviderError('OpenRouter returned an empty response', undefined, undefined, 'provider');
      }

      console.warn('[AI Provider] Success');
      return {
        provider: this.name,
        content,
        raw: parsed,
      };
    } catch (error) {
      console.error('[AI Provider] OpenRouter request failed');
      throw error;
    }
  }
}
