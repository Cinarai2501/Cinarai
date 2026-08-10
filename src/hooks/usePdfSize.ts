"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/**
 * Measures the content-box dimensions of a container element.
 *
 * Strategy:
 * 1. useLayoutEffect reads getBoundingClientRect() synchronously before the
 *    browser paints so the first render can receive the available dimensions.
 * 2. ResizeObserver keeps both dimensions up to date for layout changes.
 * 3. Window resize/orientation change events are also listened to so the
 *    dimensions recalculate when mobile browser chrome changes the layout.
 */
export function usePdfSize<T extends HTMLElement>() {
  const [containerElement, setContainerElement] = useState<T | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const lastPositiveWidth = useRef(0);
  const lastPositiveHeight = useRef(0);
  const containerRef = useCallback((element: T | null) => {
    setContainerElement(element);
  }, []);

  useLayoutEffect(() => {
    if (!containerElement) return;

    const measure = () => {
      const rect = containerElement.getBoundingClientRect();
      const nextWidth = Math.floor(rect.width);
      const nextHeight = Math.floor(rect.height);
      if (Number.isFinite(nextWidth) && nextWidth > 0 && nextWidth !== lastPositiveWidth.current) {
        lastPositiveWidth.current = nextWidth;
        setContainerWidth(nextWidth);
      }
      if (Number.isFinite(nextHeight) && nextHeight > 0 && nextHeight !== lastPositiveHeight.current) {
        lastPositiveHeight.current = nextHeight;
        setContainerHeight(nextHeight);
      }
    };

    measure();

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      measure();
    });

    observer.observe(containerElement);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [containerElement]);

  return { containerRef, containerWidth, containerHeight };
}
