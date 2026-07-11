'use client';

import { useCallback, useEffect } from 'react';
import { useLearningEngine } from '../../../hooks/useLearningEngine';
import { useIdentificationContext } from '../context/IdentificationContext';

export default function IdentificationNavigation() {
  const { checkedItems } = useIdentificationContext();
  const { registerSlideNav, unregisterSlideNav } = useLearningEngine();

  const currentItem = checkedItems ? Object.keys(checkedItems).length > 0 : false;
  const canGoNext = Boolean(currentItem);

  const goNext = useCallback(() => undefined, []);
  const goPrev = useCallback(() => undefined, []);

  useEffect(() => {
    registerSlideNav({
      slideIndex: 0,
      totalSlides: 1,
      canGoNext,
      canGoPrev: false,
      goNext,
      goPrev,
    });
  }, [canGoNext, goNext, goPrev, registerSlideNav]);

  useEffect(() => () => unregisterSlideNav(), [unregisterSlideNav]);

  return null;
}
