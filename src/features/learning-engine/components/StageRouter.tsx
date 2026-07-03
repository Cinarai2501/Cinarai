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
import type { ReactElement } from 'react';

/** Map setiap Stage enum ke komponen-nya — tidak ada string hardcode */
const STAGE_COMPONENTS: Record<Stage, ReactElement> = {
  [Stage.Cover]:             <CoverStage />,
  [Stage.Contextualization]: <ContextualizationStage />,
  [Stage.Identification]:    <IdentificationStage />,
  [Stage.Navigation]:        <NavigationStage />,
  [Stage.Argumentation]:     <ArgumentationStage />,
  [Stage.Resolution]:        <ResolutionStage />,
  [Stage.Application]:       <ApplicationStage />,
  [Stage.Introspection]:     <IntrospectionStage />,
  [Stage.Finish]:            <FinishStage />,
};

export default function StageRouter() {
  const { currentStage, isLoading } = useLearningEngine();

  if (isLoading) return null;

  return STAGE_COMPONENTS[currentStage] ?? null;
}
