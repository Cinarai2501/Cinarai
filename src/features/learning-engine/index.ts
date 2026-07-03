export { default as LearningEngine } from './components/LearningEngine';
export { default as LearningEngineRoot } from './components/LearningEngineRoot';
export { LearningEngineProvider, useLearningEngine } from './context/LearningEngineContext';
export { getComicById, getComicBySlug } from './services/comicService';
export { Stage, LEARNING_STAGES, ALL_STAGES } from './types';
export type { LearningContextValue, LearningStage } from './types';

// Layout components — dapat dipakai langsung oleh stage jika perlu
export { default as LearningLayout } from './components/layout/LearningLayout';
export { default as LearningHeader } from './components/layout/LearningHeader';
export { default as LearningProgress } from './components/layout/LearningProgress';
export { default as LearningBreadcrumb } from './components/layout/LearningBreadcrumb';
export { default as LearningContent } from './components/layout/LearningContent';
export { default as LearningBottomNav } from './components/layout/LearningBottomNav';
