"use client";

import { useLayoutEffect, useRef, useState } from "react";

const DEFAULT_MOBILE_WIDTH = 360;
const DEFAULT_DESKTOP_WIDTH = 800;

function getDefaultWidth(): number {
  if (typeof window === "undefined") return DEFAULT_MOBILE_WIDTH;
  return window.innerWidth >= 1024 ? DEFAULT_DESKTOP_WIDTH : DEFAULT_MOBILE_WIDTH;
}

/**
 * Measures the content-box width of a container element.
 *
 * Strategy:
 * 1. useLayoutEffect reads getBoundingClientRect().width synchronously before
 *    the browser paints so the first render already receives a real width.
 * 2. ResizeObserver keeps the value up to date for layout changes.
 * 3. A safe fallback width is used when the measured width is 0 (e.g. during
 *    the first paint when the flex container hasn't laid out yet).
 * 4. Window resize/orientation change events are also listened to so the
 *    width recalculates when the viewport changes without a container resize.
 */
export function usePdfSize<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const lastPositiveWidth = useRef<number>(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const next = Math.floor(el.getBoundingClientRect().width);
      if (next > 0) {
        lastPositiveWidth.current = next;
        setContainerWidth(next);
      } else if (lastPositiveWidth.current > 0) {
        setContainerWidth(lastPositiveWidth.current);
      } else {
        setContainerWidth(getDefaultWidth());
      }
    };

    measure();

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const next = Math.floor(entry.contentRect.width);
      if (next > 0) {
        lastPositiveWidth.current = next;
        setContainerWidth(next);
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

  return { containerRef, containerWidth };
}
