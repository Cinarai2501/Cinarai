'use client';

import { Stage } from '../types';
import { useLearningEngine } from '../hooks/useLearningEngine';
import CoverStage from './stages/CoverStage';
import ContextualizationStage from './stages/ContextualizationStage';
import IdentificationStage from './stages/IdentificationStage';
import NavigationStage from './stages/NavigationStage';
import ArgumentationStage from './stages/ArgumentationStage';
import ResolutionStage from './stages/ResolutionStage';
import ApplicationStage from './stages/ApplicationStage';
import IntrospectionStage from './stages/IntrospectionStage';
import FinishStage from './stages/FinishStage';

export default function StageRouter() {
  const { currentStage, isLoading } = useLearningEngine();

  if (isLoading) return null;

  switch (currentStage) {
    case Stage.Cover:             return <CoverStage />;
    case Stage.Contextualization: return <ContextualizationStage />;
    case Stage.Identification:    return <IdentificationStage />;
    case Stage.Navigation:        return <NavigationStage />;
    case Stage.Argumentation:     return <ArgumentationStage />;
    case Stage.Resolution:        return <ResolutionStage />;
    case Stage.Application:       return <ApplicationStage />;
    case Stage.Introspection:     return <IntrospectionStage />;
    case Stage.Finish:            return <FinishStage />;
    default:                      return null;
  }
}
