import { NextRequest, NextResponse } from 'next/server';
import { generateTutorResponse } from '@/lib/ai';
import type { TutorContext } from '@/lib/ai/service';

export const runtime = 'nodejs';

type AiChatRequestBody = {
  question?: string;
  context?: Partial<TutorContext>;
};

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4_000;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AiChatRequestBody;
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    const context = body?.context;

    if (!question || !context) {
      return NextResponse.json(
        { error: 'question and context are required' },
        { status: 400 },
      );
    }

    const history = Array.isArray(context.sessionHistory)
      ? context.sessionHistory
        .filter((message) => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
        .slice(-MAX_HISTORY_MESSAGES)
        .map((message) => ({ role: message.role, content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH) }))
        .filter((message) => message.content.length > 0)
      : [];

    const response = await generateTutorResponse({
      moduleName: context.moduleName ?? 'Navigation',
      identification: context.identification ?? [],
      objectInfo: context.objectInfo ?? {
        location: '',
        classLevel: '',
        synopsis: '',
        learningTargets: [],
      },
      observationAnswers: context.observationAnswers ?? {},
      question,
      sessionHistory: history,
      comicTitle: context.comicTitle,
      pageLabel: context.pageLabel,
      objectName: context.objectName,
      learningStage: context.learningStage,
      knowledgeContext: context.knowledgeContext,
    }, undefined, { throwOnError: true });

    return NextResponse.json({
      answer: response.answer,
      provider: response.provider,
    });
  } catch (error) {
    console.error('[ai/chat] AI Tutor request failed', error);
    return NextResponse.json(
      { error: 'Maaf, Tutor AI sedang mengalami gangguan. Coba kirim pertanyaan lagi.' },
      { status: 502 },
    );
  }
}
