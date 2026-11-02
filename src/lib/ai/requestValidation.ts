import type { TutorContext } from './service';

export type RequestValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type ValidTutorRequest = {
  question: string;
  context: TutorContext;
};

export type ValidApplicationRequest = {
  soal?: string;
  konteks?: string;
  gambar?: string[];
  jawabanSiswa: string[];
  jawabanAlasan: string;
  attempt?: number;
};

export type ValidArgumentationRequest = {
  question: string;
  studentAnswer: string;
  shapeName: string;
  templePart: string;
  comicTitle: string;
  lokasi: string;
  classLevel: string;
};

const TUTOR_CONTEXT_KEYS = new Set([
  'moduleName',
  'identification',
  'objectInfo',
  'observationAnswers',
  'sessionHistory',
  'comicTitle',
  'pageLabel',
  'objectName',
  'learningStage',
  'objectDescription',
  'arProvider',
  'modelUrl',
  'learningGoal',
  'numeracyConcept',
  'cultureConcept',
  'knowledgeContext',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function optionalString(value: unknown, maximum: number): boolean {
  return value === undefined || (typeof value === 'string' && value.length <= maximum);
}

function validateTutorContext(context: Record<string, unknown>): boolean {
  if (!hasOnlyKeys(context, TUTOR_CONTEXT_KEYS)) return false;
  const stringLimits: Record<string, number> = {
    moduleName: 120,
    comicTitle: 160,
    pageLabel: 80,
    objectName: 160,
    learningStage: 80,
    objectDescription: 700,
    arProvider: 100,
    modelUrl: 500,
    learningGoal: 400,
    numeracyConcept: 300,
    cultureConcept: 300,
    knowledgeContext: 2_000,
  };
  if (!Object.entries(stringLimits).every(([key, maximum]) => optionalString(context[key], maximum))) return false;

  if (context.objectInfo !== undefined) {
    const objectInfo = context.objectInfo;
    if (!isRecord(objectInfo)
      || !hasOnlyKeys(objectInfo, new Set(['location', 'classLevel', 'synopsis', 'learningTargets']))
      || !optionalString(objectInfo.location, 160)
      || !optionalString(objectInfo.classLevel, 60)
      || !optionalString(objectInfo.synopsis, 600)
      || (objectInfo.learningTargets !== undefined
        && (!Array.isArray(objectInfo.learningTargets)
          || objectInfo.learningTargets.length > 12
          || !objectInfo.learningTargets.every((target) => typeof target === 'string' && target.length <= 160)))) {
      return false;
    }
  }

  if (context.identification !== undefined
    && (!Array.isArray(context.identification)
      || context.identification.length > 20
      || !context.identification.every((entry) => {
        if (!isRecord(entry)
          || !hasOnlyKeys(entry, new Set(['step', 'selectedAnswer', 'note', 'reason']))) return false;
        return (entry.step === undefined || (Number.isInteger(entry.step) && Number(entry.step) >= 0 && Number(entry.step) <= 200))
          && (entry.selectedAnswer === undefined || entry.selectedAnswer === null || optionalString(entry.selectedAnswer, 300))
          && optionalString(entry.note, 300)
          && optionalString(entry.reason, 500);
      }))) {
    return false;
  }

  if (context.observationAnswers !== undefined) {
    const answers = context.observationAnswers;
    if (!isRecord(answers)
      || Object.keys(answers).length > 20
      || !Object.entries(answers).every(([key, value]) => key.length <= 80 && typeof value === 'string' && value.length <= 500)) {
      return false;
    }
  }

  if (context.sessionHistory !== undefined
    && (!Array.isArray(context.sessionHistory)
      || context.sessionHistory.length > 20
      || !context.sessionHistory.every((entry) => isRecord(entry)
        && hasOnlyKeys(entry, new Set(['role', 'content']))
        && (entry.role === 'user' || entry.role === 'assistant')
        && typeof entry.content === 'string'
        && entry.content.trim().length > 0
        && entry.content.length <= 1_000))) {
    return false;
  }

  const totalContextLength = Object.entries(context).reduce((total, [key, value]) => {
    if (typeof value === 'string') return total + key.length + value.length;
    try {
      return total + key.length + JSON.stringify(value).length;
    } catch {
      return Number.POSITIVE_INFINITY;
    }
  }, 0);
  return totalContextLength <= 8_000;
}

export function validateTutorRequest(value: unknown): RequestValidationResult<ValidTutorRequest> {
  if (!isRecord(value) || !hasOnlyKeys(value, new Set(['question', 'context']))) {
    return { ok: false, error: 'Format permintaan Tutor AI tidak valid.' };
  }
  if (typeof value.question !== 'string' || !value.question.trim() || value.question.length > 1_000) {
    return { ok: false, error: 'Pertanyaan wajib diisi dan maksimal 1.000 karakter.' };
  }
  if (!isRecord(value.context) || !validateTutorContext(value.context)) {
    return { ok: false, error: 'Konteks pembelajaran tidak valid atau melebihi batas.' };
  }
  const rawContext = value.context;
  const rawObjectInfo = isRecord(rawContext.objectInfo) ? rawContext.objectInfo : {};
  const identification = Array.isArray(rawContext.identification)
    ? rawContext.identification.map((entry) => {
      const item = isRecord(entry) ? entry : {};
      return {
        step: typeof item.step === 'number' ? item.step : 0,
        selectedAnswer: typeof item.selectedAnswer === 'string' ? item.selectedAnswer : null,
        note: typeof item.note === 'string' ? item.note : '',
        reason: typeof item.reason === 'string' ? item.reason : '',
      };
    })
    : [];
  const sessionHistory = Array.isArray(rawContext.sessionHistory)
    ? rawContext.sessionHistory.map((entry) => {
      const item = isRecord(entry) ? entry : {};
      return {
        role: item.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: typeof item.content === 'string' ? item.content.trim() : '',
      };
    })
    : [];
  const observationAnswers = isRecord(rawContext.observationAnswers)
    ? Object.fromEntries(Object.entries(rawContext.observationAnswers)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {};
  const context: TutorContext = {
    moduleName: typeof rawContext.moduleName === 'string' ? rawContext.moduleName : 'Navigation',
    identification,
    objectInfo: {
      location: typeof rawObjectInfo.location === 'string' ? rawObjectInfo.location : '',
      classLevel: typeof rawObjectInfo.classLevel === 'string' ? rawObjectInfo.classLevel : '',
      synopsis: typeof rawObjectInfo.synopsis === 'string' ? rawObjectInfo.synopsis : '',
      learningTargets: Array.isArray(rawObjectInfo.learningTargets)
        ? rawObjectInfo.learningTargets.filter((target): target is string => typeof target === 'string')
        : [],
    },
    observationAnswers,
    question: value.question.trim(),
    sessionHistory,
    ...(typeof rawContext.comicTitle === 'string' ? { comicTitle: rawContext.comicTitle } : {}),
    ...(typeof rawContext.pageLabel === 'string' ? { pageLabel: rawContext.pageLabel } : {}),
    ...(typeof rawContext.objectName === 'string' ? { objectName: rawContext.objectName } : {}),
    ...(typeof rawContext.learningStage === 'string' ? { learningStage: rawContext.learningStage } : {}),
    ...(typeof rawContext.objectDescription === 'string' ? { objectDescription: rawContext.objectDescription } : {}),
    ...(typeof rawContext.arProvider === 'string' ? { arProvider: rawContext.arProvider } : {}),
    ...(typeof rawContext.modelUrl === 'string' ? { modelUrl: rawContext.modelUrl } : {}),
    ...(typeof rawContext.learningGoal === 'string' ? { learningGoal: rawContext.learningGoal } : {}),
    ...(typeof rawContext.numeracyConcept === 'string' ? { numeracyConcept: rawContext.numeracyConcept } : {}),
    ...(typeof rawContext.cultureConcept === 'string' ? { cultureConcept: rawContext.cultureConcept } : {}),
    ...(typeof rawContext.knowledgeContext === 'string' ? { knowledgeContext: rawContext.knowledgeContext } : {}),
  };
  return { ok: true, value: { question: value.question.trim(), context } };
}

export function validateApplicationRequest(value: unknown): RequestValidationResult<ValidApplicationRequest> {
  const allowed = new Set(['soal', 'konteks', 'gambar', 'jawabanSiswa', 'jawabanAlasan', 'attempt']);
  if (!isRecord(value) || !hasOnlyKeys(value, allowed)) {
    return { ok: false, error: 'Format permintaan AI Coach tidak valid.' };
  }
  if (typeof value.jawabanAlasan !== 'string' || !value.jawabanAlasan.trim() || value.jawabanAlasan.length > 1_000
    || !Array.isArray(value.jawabanSiswa) || value.jawabanSiswa.length > 20 || value.jawabanSiswa.length === 0
    || !value.jawabanSiswa.every((answer) => typeof answer === 'string' && answer.length <= 300)
    || !optionalString(value.soal, 1_000)
    || !optionalString(value.konteks, 1_000)
    || (value.gambar !== undefined
      && (!Array.isArray(value.gambar) || value.gambar.length > 12
        || !value.gambar.every((image) => typeof image === 'string' && image.length <= 300)))
    || (value.attempt !== undefined
      && (!Number.isInteger(value.attempt) || Number(value.attempt) < 0 || Number(value.attempt) > 100))) {
    return { ok: false, error: 'Jawaban AI Coach tidak valid atau melebihi batas.' };
  }
  return {
    ok: true,
    value: {
      ...(typeof value.soal === 'string' ? { soal: value.soal } : {}),
      ...(typeof value.konteks === 'string' ? { konteks: value.konteks } : {}),
      ...(Array.isArray(value.gambar) ? { gambar: value.gambar.filter((image): image is string => typeof image === 'string') } : {}),
      jawabanSiswa: value.jawabanSiswa.filter((answer): answer is string => typeof answer === 'string'),
      jawabanAlasan: value.jawabanAlasan,
      ...(typeof value.attempt === 'number' ? { attempt: value.attempt } : {}),
    },
  };
}

const ARGUMENTATION_FIELDS = [
  'question',
  'studentAnswer',
  'shapeName',
  'templePart',
  'comicTitle',
  'lokasi',
  'classLevel',
] as const;

export function validateArgumentationRequest(value: unknown): RequestValidationResult<ValidArgumentationRequest> {
  const allowed = new Set<string>(ARGUMENTATION_FIELDS);
  if (!isRecord(value) || !hasOnlyKeys(value, allowed)
    || !ARGUMENTATION_FIELDS.every((field) =>
      typeof value[field] === 'string' && Boolean((value[field] as string).trim()) && (value[field] as string).length <= 1_000
    )) {
    return { ok: false, error: 'Data analisis argumentasi tidak valid atau melebihi batas.' };
  }
  const totalLength = ARGUMENTATION_FIELDS.reduce((total, field) => total + (value[field] as string).length, 0);
  if (totalLength > 4_000) {
    return { ok: false, error: 'Data analisis argumentasi melebihi batas.' };
  }
  return {
    ok: true,
    value: {
      question: value.question as string,
      studentAnswer: value.studentAnswer as string,
      shapeName: value.shapeName as string,
      templePart: value.templePart as string,
      comicTitle: value.comicTitle as string,
      lokasi: value.lokasi as string,
      classLevel: value.classLevel as string,
    },
  };
}

const INTROSPECTION_FIELDS = new Set([
  'comicTitle',
  'lokasi',
  'classLevel',
  'checklist',
  'confidence',
  'reflectionText',
  'stagePerformance',
  'identificationAnswers',
  'applicationActivities',
  'identificationResult',
  'navigationResult',
  'argumentationResult',
  'resolutionResult',
  'applicationResult',
]);

function isStringArray(value: unknown, maxItems: number, maxLength: number): value is string[] {
  return Array.isArray(value)
    && value.length <= maxItems
    && value.every((entry) => typeof entry === 'string' && entry.length <= maxLength);
}

export function validateIntrospectionRequest(value: unknown): RequestValidationResult<Record<string, unknown>> {
  if (!isRecord(value) || !hasOnlyKeys(value, INTROSPECTION_FIELDS)
    || typeof value.reflectionText !== 'string' || !value.reflectionText.trim() || value.reflectionText.length > 2_000
    || !['comicTitle', 'lokasi', 'classLevel', 'identificationResult', 'navigationResult',
      'argumentationResult', 'resolutionResult', 'applicationResult'].every((field) => optionalString(value[field], 1_000))
    || (value.checklist !== undefined && !isStringArray(value.checklist, 20, 200))
    || (value.confidence !== undefined && value.confidence !== null
      && (typeof value.confidence !== 'number' || !Number.isFinite(value.confidence) || value.confidence < 1 || value.confidence > 5))
    || (value.stagePerformance !== undefined
      && (!Array.isArray(value.stagePerformance) || value.stagePerformance.length > 10
        || !value.stagePerformance.every((entry) => isRecord(entry)
          && hasOnlyKeys(entry, new Set(['stage', 'status']))
          && optionalString(entry.stage, 100)
          && optionalString(entry.status, 100))))
    || (value.identificationAnswers !== undefined
      && (!Array.isArray(value.identificationAnswers) || value.identificationAnswers.length > 20
        || !value.identificationAnswers.every((entry) => isRecord(entry)
          && hasOnlyKeys(entry, new Set(['step', 'selectedAnswer', 'note', 'reason']))
          && Number.isInteger(entry.step)
          && (entry.selectedAnswer === null || optionalString(entry.selectedAnswer, 300))
          && optionalString(entry.note, 300)
          && optionalString(entry.reason, 500))))
    || (value.applicationActivities !== undefined
      && (!Array.isArray(value.applicationActivities) || value.applicationActivities.length > 20
        || !value.applicationActivities.every((entry) => isRecord(entry)
          && hasOnlyKeys(entry, new Set(['selectedAnswer', 'studentReason', 'attempt', 'coachType', 'coachMessage', 'coachSummary']))
          && optionalString(entry.selectedAnswer, 300)
          && optionalString(entry.studentReason, 500)
          && Number.isInteger(entry.attempt)
          && optionalString(entry.coachType, 80)
          && optionalString(entry.coachMessage, 500)
          && isRecord(entry.coachSummary)
          && hasOnlyKeys(entry.coachSummary, new Set(['mastered', 'needsImprovement', 'nextPractice']))
          && isStringArray(entry.coachSummary.mastered, 5, 200)
          && isStringArray(entry.coachSummary.needsImprovement, 5, 200)
          && isStringArray(entry.coachSummary.nextPractice, 5, 200))))) {
    return { ok: false, error: 'Data refleksi tidak valid atau melebihi batas.' };
  }
  return { ok: true, value };
}
