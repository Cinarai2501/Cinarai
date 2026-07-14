export interface ComicContentPackageLike {
  metadata: {
    comicId: number;
    title: string;
    subtitle: string;
    location: string;
    classLevel: string;
    cover: string;
    thumbnail: string;
    learningTargets: string[];
    synopsis: string;
  };
  learningObjects: Array<{
    id: string;
    title: string;
    description: string;
    page: number;
    qrImage?: string;
    navImage?: string;
    objectImage?: string;
    modelUrl?: string;
    embedUrl?: string;
    viewerType?: 'embed' | 'url';
    provider?: string;
    aiPrompt?: string;
    question?: string;
    answer?: string;
    feedback?: string;
    shapeKey?: string;
    shapeName?: string;
  }>;
  qrCode: Array<{ id: string; imageSrc: string; alt: string; label: string; description: string }>;
  model3D: Array<{ id: string; title: string; arUrl: string; embedUrl?: string; viewerType?: 'embed' | 'url'; page: number; description: string; provider?: string }>;
  aiPrompt: {
    navigation: string;
    objectTutor: string;
    application: string;
    argumentation: string;
    resolution: string;
    introspection: string;
  };
  identification: {
    questions: Array<{
      id: string;
      question: string;
      image: string;
      imageAlt: string;
      overlayType?: string;
      crop?: string;
      highlight?: string;
      options: Array<{ text: string; correct: boolean }>;
      explanation: string;
    }>;
    feedback: {
      complete: string;
      partial: string;
      incomplete: string;
    };
  };
  application: {
    title: string;
    intro: string;
    prompt: string;
    context: string;
    images: Array<{ src: string; alt: string; label: string; description: string }>;
    options: Array<{ value: string; label: string }>;
  };
  argumentation: {
    questions: Array<{
      id: string;
      title?: string;
      templePart: string;
      question: string;
      photoSrc: string;
      image?: string;
      photoAlt: string;
      overlaySrc?: string;
      shape?: string;
      shapeName: string;
      shapeKey: string;
      shapeSrc: string;
      icon?: string;
      aiContext?: string;
      feedback?: string;
      highlightColor: string;
    }>;
  };
  resolution: {
    missions: Array<{
      id: number;
      title: string;
      part: string;
      shape: string;
      prompt: string;
      options: Array<{ key: string; label: string }>;
      correctKey: string;
      answer: string;
      formula: string;
      explanation: string;
      aiHint: string;
      context: string;
      accent: string;
      illustration: string;
    }>;
  };
  introspection: {
    checklist: string[];
    completionMessage: string;
    nextPrompt: string;
  };
  report: {
    summary: string;
    learnedShapes: string[];
  };
}

export interface ComicModuleLike {
  metadata: {
    comicId: number;
    title: string;
    subtitle: string;
    location: string;
    classLevel: string;
    cover: string;
    thumbnail: string;
    learningTargets: string[];
    synopsis: string;
  };
  navigation: {
    learningObjects: Array<{
      id: string;
      title: string;
      description: string;
      page: number;
      qrImage?: string;
      objectImage?: string;
      modelUrl?: string;
      embedUrl?: string;
      viewerType?: 'embed' | 'url';
      provider?: string;
      aiPrompt?: string;
      question?: string;
      answer?: string;
      feedback?: string;
      shapeKey?: string;
      shapeName?: string;
    }>;
    qrCode: Array<{ id: string; imageSrc: string; alt: string; label: string; description: string }>;
    model3D: Array<{ id: string; title: string; arUrl: string; embedUrl?: string; viewerType?: 'embed' | 'url'; page: number; description: string; provider?: string }>;
  };
  identification: {
    questions: Array<{
      id: string;
      question: string;
      image: string;
      imageAlt: string;
      overlayType?: string;
      crop?: string;
      highlight?: string;
      options: Array<{ text: string; correct: boolean }>;
      explanation: string;
    }>;
    feedback: {
      complete: string;
      partial: string;
      incomplete: string;
    };
  };
  application: {
    title: string;
    intro: string;
    prompt: string;
    context: string;
    images: Array<{ src: string; alt: string; label: string; description: string }>;
    options: Array<{ value: string; label: string }>;
  };
  argumentation: {
    questions: Array<{
      id: string;
      title?: string;
      templePart: string;
      question: string;
      photoSrc: string;
      image?: string;
      photoAlt: string;
      overlaySrc?: string;
      shape?: string;
      shapeName: string;
      shapeKey: string;
      shapeSrc: string;
      icon?: string;
      aiContext?: string;
      feedback?: string;
      highlightColor: string;
    }>;
  };
  resolution: {
    missions: Array<{
      id: number;
      title: string;
      part: string;
      shape: string;
      prompt: string;
      options: Array<{ key: string; label: string }>;
      correctKey: string;
      answer: string;
      formula: string;
      explanation: string;
      aiHint: string;
      context: string;
      accent: string;
      illustration: string;
    }>;
  };
  introspection: {
    checklist: string[];
    completionMessage: string;
    nextPrompt: string;
  };
  report: {
    summary: string;
    learnedShapes: string[];
  };
  ai: {
    navigation: string;
    objectTutor: string;
    application: string;
    argumentation: string;
    resolution: string;
    introspection: string;
  };
  assets: {
    qrCode: Array<{ id: string; imageSrc: string; alt: string; label: string; description: string }>;
    model3D: Array<{ id: string; title: string; arUrl: string; embedUrl?: string; viewerType?: 'embed' | 'url'; page: number; description: string; provider?: string }>;
  };
  objects: Array<{
    id: string;
    title: string;
    description: string;
    page: number;
    qrImage?: string;
    objectImage?: string;
    modelUrl?: string;
    embedUrl?: string;
    viewerType?: 'embed' | 'url';
    provider?: string;
    aiPrompt?: string;
    question?: string;
    answer?: string;
    feedback?: string;
    shapeKey?: string;
    shapeName?: string;
  }>;
}

export type ComicModule = ComicModuleLike;

