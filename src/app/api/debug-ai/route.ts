import { NextResponse } from 'next/server';
import { getAiProviderRuntimeStatus } from '@/lib/ai/debug';
import { getAiRequestAccess } from '@/lib/ai/serverRequestAccess';
import { aiRequestAccessErrorResponse } from '@/lib/ai/requestAccess';

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in non-development environments.' }, { status: 404 });
  }

  const access = await getAiRequestAccess(request, ['admin']);
  if (!access.ok) return aiRequestAccessErrorResponse(access);

  const status = getAiProviderRuntimeStatus();

  return NextResponse.json({
    gemini: status.gemini.ready,
    geminiKeyCount: status.gemini.keyCount,
    openai: status.openai.ready,
    openaiKeyCount: status.openai.keyCount,
    groq: status.groq.ready,
    groqKeyCount: status.groq.keyCount,
    openrouter: status.openrouter.ready,
    openrouterKeyCount: status.openrouter.keyCount,
  });
}
