'use client';


export interface ReflectionSaveInput {
  userId: string;
  comicId: number;
  checklist: string[];
  confidence: number | null;
  reflectionText: string;
  stage: string;
  rating?: number | null;
  aiReflection?: { appreciation: string; needsImprovement: string; suggestion: string } | string | null;
  response?: string;
  status?: string;
}

export interface ReflectionDocumentPayload {
  userId: string;
  studentId: string;
  moduleId: string;
  comicId: string;
  checklist: string[];
  selectedChecklist: string[];
  confidence: number | null;
  rating: number | null;
  reflectionText: string;
  stage: string;
  status: string;
  timestamp: unknown;
  createdAt: unknown;
  submittedAt: unknown;
  aiReflection?: { appreciation: string; needsImprovement: string; suggestion: string } | string;
  response?: string;
}

export interface ReflectionDependencies {
  getCurrentUser: () => { uid?: string } | null | undefined;
  getFirestoreDocument: (collection: string, docId: string) => Promise<unknown>;
  mergeFirestoreDocument: (collection: string, docId: string, payload: Record<string, unknown>) => Promise<void>;
  serverTimestamp: () => unknown;
}

const MIN_REFLECTION_LENGTH = 10;

const defaultDependencies: ReflectionDependencies = {
  getCurrentUser: () => ({ uid: undefined }),
  getFirestoreDocument: async () => null,
  mergeFirestoreDocument: async () => undefined,
  serverTimestamp: () => ({ __type: 'serverTimestamp' }),
};

export function buildReflectionDocumentPayload(
  input: ReflectionSaveInput,
  serverTimestampFn: ReflectionDependencies['serverTimestamp'] = defaultDependencies.serverTimestamp,
): ReflectionDocumentPayload {
  const payload: ReflectionDocumentPayload = {
    userId: input.userId,
    studentId: input.userId,
    moduleId: String(input.comicId),
    comicId: String(input.comicId),
    checklist: input.checklist,
    selectedChecklist: input.checklist,
    confidence: input.confidence,
    rating: input.rating ?? input.confidence ?? null,
    reflectionText: input.reflectionText.trim(),
    stage: input.stage,
    status: input.status ?? 'completed',
    timestamp: serverTimestampFn(),
    createdAt: serverTimestampFn(),
    submittedAt: serverTimestampFn(),
  };

  if (input.aiReflection !== undefined && input.aiReflection !== null) {
    payload.aiReflection = input.aiReflection;
  }

  if (input.response) {
    payload.response = input.response;
  }

  return payload;
}

export async function saveReflection(
  input: ReflectionSaveInput,
  deps: ReflectionDependencies = defaultDependencies,
): Promise<void> {
  const authUser = deps.getCurrentUser();
  const resolvedUserId = input.userId || authUser?.uid;

  if (!resolvedUserId?.trim()) {
    throw new Error('Invalid user');
  }

  const reflectionText = input.reflectionText.trim();
  if (reflectionText.length < MIN_REFLECTION_LENGTH) {
    throw new Error('Invalid reflection');
  }

  const docId = `${resolvedUserId}_${input.comicId}_introspection`;
  const existingDocument = await deps.getFirestoreDocument('reflection', docId);

  if (existingDocument) {
    throw new Error('Duplicate reflection submission');
  }

  const payload = buildReflectionDocumentPayload(
    {
      ...input,
      userId: resolvedUserId,
      reflectionText,
    },
    deps.serverTimestamp,
  );

  await deps.mergeFirestoreDocument('reflection', docId, payload as unknown as Record<string, unknown>);
}

export async function saveReflectionDocument(input: ReflectionSaveInput): Promise<void> {
  await saveReflection(input);
}
