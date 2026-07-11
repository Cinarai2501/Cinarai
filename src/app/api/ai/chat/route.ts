import { NextRequest, NextResponse } from 'next/server';
import { generateTutorResponse } from '@/lib/ai';
import type { TutorContext } from '@/lib/ai/service';

export const runtime = 'nodejs';

type AiChatRequestBody = {
  question?: string;
  context?: Partial<TutorContext>;
};

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
      sessionHistory: context.sessionHistory ?? [],
      comicTitle: context.comicTitle,
      pageLabel: context.pageLabel,
      objectName: context.objectName,
      learningStage: context.learningStage,
      knowledgeContext: context.knowledgeContext,
    });

    return NextResponse.json({
      answer: response.answer,
      provider: response.provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
