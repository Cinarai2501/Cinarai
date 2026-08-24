import type { ComicContentPackageLike } from '../../types';

export const packageContent: ComicContentPackageLike = {
  metadata: {
    comicId: 6,
    title: '',
    subtitle: '',
    location: '',
    classLevel: '',
    cover: '',
    thumbnail: '',
    learningTargets: [],
    synopsis: '',
  },
  learningObjects: [],
  qrCode: [],
  model3D: [],
  aiPrompt: {
    navigation: '',
    objectTutor: '',
    application: '',
    argumentation: '',
    resolution: '',
    introspection: '',
  },
  identification: {
    questions: [],
    feedback: {
      complete: '',
      partial: '',
      incomplete: '',
    },
  },
  application: {
    title: '',
    intro: '',
    prompt: '',
    context: '',
    images: [],
    options: [],
  },
  argumentation: {
    questions: [],
  },
  resolution: {
    missions: [],
  },
  introspection: {
    checklist: [],
    completionMessage: '',
    nextPrompt: '',
  },
  report: {
    summary: '',
    learnedShapes: [],
  },
};
