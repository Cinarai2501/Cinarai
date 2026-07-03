export { default as LearningEngine } from './components/LearningEngine';
export { default as LearningEngineRoot } from './components/LearningEngineRoot';
export { LearningEngineProvider, useLearningEngine } from './context/LearningEngineContext';
export { getComicById, getComicBySlug } from './services/comicService';
export { Stage, LEARNING_STAGES, ALL_STAGES } from './types';
export type { LearningContextValue, LearningStage } from './types';
