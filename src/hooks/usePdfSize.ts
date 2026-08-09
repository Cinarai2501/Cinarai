"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Measures the content-box dimensions of a container element.
 *
 * Strategy:
 * 1. useLayoutEffect reads getBoundingClientRect().width synchronously before
 *    the browser paints so the first render already receives a real width.
 * 2. ResizeObserver keeps both dimensions up to date for layout changes.
 * 3. Window resize/orientation change events are also listened to so the
 *    dimensions recalculate when mobile browser chrome changes the layout.
 */
export function usePdfSize<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const lastPositiveWidth = useRef<number>(0);
  const lastPositiveHeight = useRef<number>(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const nextWidth = Math.floor(rect.width);
      const nextHeight = Math.floor(rect.height);
      if (nextWidth > 0) {
        lastPositiveWidth.current = nextWidth;
        setContainerWidth(nextWidth);
      } else if (lastPositiveWidth.current > 0) {
        setContainerWidth(lastPositiveWidth.current);
      }
      if (nextHeight > 0) {
        lastPositiveHeight.current = nextHeight;
        setContainerHeight(nextHeight);
      } else if (lastPositiveHeight.current > 0) {
        setContainerHeight(lastPositiveHeight.current);
      }
    };

    measure();

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const nextWidth = Math.floor(entry.contentRect.width);
      const nextHeight = Math.floor(entry.contentRect.height);
      if (nextWidth > 0) {
        lastPositiveWidth.current = nextWidth;
        setContainerWidth(nextWidth);
      }
      if (nextHeight > 0) {
        lastPositiveHeight.current = nextHeight;
        setContainerHeight(nextHeight);
      }
    });

    observer.observe(el);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  return { containerRef, containerWidth, containerHeight };
}
