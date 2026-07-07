'use client';

import { IdentificationProvider, useIdentificationContext } from '../context/IdentificationContext';
import StepAmati from './StepAmati';
import StepIdentifikasi from './StepIdentifikasi';
import StepKonfirmasi from './StepKonfirmasi';

interface IdentificationLayoutProps {
  comicId: number;
  lokasi: string;
  subtitle: string;
  kelas: string;
  cover: string;
  title: string;
  learningTargets: readonly string[];
  onCompleteChange?: (isComplete: boolean) => void;
}

function StepRouter() {
  const { currentStep } = useIdentificationContext();

  if (currentStep === 'OBSERVE') return <StepAmati />;
  if (currentStep === 'CONFIRM') return <StepKonfirmasi />;
  return <StepIdentifikasi />;
}

export default function IdentificationLayout(props: IdentificationLayoutProps) {
  return (
    <IdentificationProvider {...props}>
      <StepRouter />
    </IdentificationProvider>
  );
}
