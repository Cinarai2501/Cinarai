"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Measures the content-box width of a container element.
 *
 * Strategy:
 * 1. useLayoutEffect reads getBoundingClientRect().width synchronously before
 *    the browser paints — so the very first render already has the correct
 *    width and <Page width={...}> never receives 0 or undefined.
 * 2. ResizeObserver keeps the value up-to-date on every subsequent layout
 *    change (window resize, orientation change, sidebar toggle, zoom).
 * 3. entry.contentRect.width is used inside the ResizeObserver callback
 *    because it is the content-box width already excluding border and padding,
 *    matching what getBoundingClientRect gives when the element has no border.
 */
export function usePdfSize<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── 1. Synchronous initial measurement ──────────────────────────────────
    // getBoundingClientRect() runs synchronously inside useLayoutEffect,
    // before the browser has painted. This guarantees the first render of
    // <Page> receives the real container width, not 0 or undefined.
    const initial = Math.floor(el.getBoundingClientRect().width);
    if (initial > 0) setContainerWidth(initial);

    // ── 2. ResizeObserver for subsequent changes ─────────────────────────────
    // contentRect.width is the content-box width (excludes border + padding).
    // The element containerRef is attached to has no border and no horizontal
    // padding, so contentRect.width == getBoundingClientRect().width here.
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const next = Math.floor(entry.contentRect.width);
      if (next > 0) setContainerWidth(next);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, containerWidth };
}
