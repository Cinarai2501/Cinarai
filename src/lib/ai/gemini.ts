import { AiProviderError, createAiProviderHttpError } from './provider';
import type { AiProviderErrorCode } from './provider';
import type { AiProvider, AiProviderConfig, AiRequestPayload, AiResponse } from './provider';

export class GeminiProvider implements AiProvider {
  public readonly name = 'gemini' as const;

  constructor(private readonly config: AiProviderConfig = {}) {}

  async generate(payload: AiRequestPayload, signal?: AbortSignal): Promise<AiResponse> {
    const apiKey = this.config.apiKey?.trim();
    console.warn('[AI Provider] Trying Gemini...');
    if (!apiKey) {
      throw new AiProviderError('Gemini API key is not configured');
    }

    try {
      console.warn('[AI Provider] Request sent');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model ?? 'gemini-3.6-flash'}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          signal,
          body: JSON.stringify({
            ...(payload.systemPrompt
              ? { systemInstruction: { parts: [{ text: payload.systemPrompt }] } }
              : {}),
            contents: [
              {
                role: 'user',
                parts: [{ text: payload.prompt }],
              },
            ],
            generationConfig: {
              temperature: payload.temperature ?? 0.7,
              maxOutputTokens: payload.maxTokens ?? 220,
              ...(this.config.model?.startsWith('gemini-3') || !this.config.model
                ? {
                  thinkingConfig: {
                    thinkingLevel: payload.metadata?.aiHealthCheck === true
                      || payload.metadata?.aiThinkingLevel === 'MINIMAL'
                      ? 'MINIMAL'
                      : 'LOW',
                  },
                }
                : {}),
            },
          }),
        },
      );

      console.warn('[AI Provider] Response received');
      console.warn(`[AI Provider] Status Code = ${response.status}`);

      const rawBody = await response.text();
      if (!response.ok) {
        throw createAiProviderHttpError(response, rawBody);
      }

      let data: unknown;
      try {
        data = JSON.parse(rawBody) as {
          candidates?: Array<{
            finishReason?: string;
            content?: { parts?: Array<{ text?: string }> };
          }>;
          promptFeedback?: { blockReason?: string };
        };
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new AiProviderError('Gemini returned an invalid response body', undefined, undefined, 'provider');
        }
        throw error;
      }

      console.warn('[AI Provider] Parsing Result = success');
      const parsed = data as {
        candidates?: Array<{
          finishReason?: string;
          content?: { parts?: Array<{ text?: string }> };
        }>;
        promptFeedback?: { blockReason?: string };
      };
      const content = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
      if (parsed.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        throw new AiProviderError(
          'Gemini reached the output token limit',
          undefined,
          undefined,
          'provider',
          undefined,
          'MAX_TOKENS',
        );
      }

      if (!content) {
        const safeCodes = new Set<AiProviderErrorCode>([
          'NO_CANDIDATE',
          'MAX_TOKENS',
          'SAFETY',
          'RECITATION',
          'BLOCKLIST',
          'PROHIBITED_CONTENT',
          'STOP',
        ]);
        const rawCode = parsed.promptFeedback?.blockReason ?? parsed.candidates?.[0]?.finishReason ?? 'NO_CANDIDATE';
        const normalizedCode = rawCode.trim().toUpperCase().replace(/[\s-]+/g, '_');
        const diagnosticCode = safeCodes.has(normalizedCode as AiProviderErrorCode)
          ? normalizedCode as AiProviderErrorCode
          : 'NO_CANDIDATE';
        throw new AiProviderError(
          'Gemini returned an empty response',
          undefined,
          undefined,
          'provider',
          undefined,
          diagnosticCode,
        );
      }

      console.warn('[AI Provider] Success');
      return {
        provider: this.name,
        content,
        raw: parsed,
      };
    } catch (error) {
      console.error('[AI Provider] Gemini request failed');
      throw error;
    }
  }
}
