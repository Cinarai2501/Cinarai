'use client';

import StepAmati from './StepAmati';
import StepIdentifikasi from './StepIdentifikasi';
import { useIdentificationContext } from '../context/IdentificationContext';

export default function IdentificationPage() {
  const { currentStep } = useIdentificationContext();

  return (
    <div className="flex flex-col gap-4">
      {currentStep === 'OBSERVE' ? <StepAmati /> : <StepIdentifikasi />}
    </div>
  );
}
