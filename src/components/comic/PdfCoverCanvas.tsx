"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { pdfjs } from "react-pdf";

/** Module-level cache: pdfPath → blob URL of the rendered cover image */
const coverCache = new Map<string, string>();
const coverRenderInFlight = new Map<string, Promise<string>>();
const coverConsumers = new Map<string, number>();

type CoverState =
  | { phase: "loading" }
  | { phase: "ready"; src: string }
  | { phase: "error" };

interface PdfCoverCanvasProps {
  pdfPath: string | null;
  title: string;
}

/**
 * Renders page 1 of a PDF as a cover image.
 *
 * - Uses ResizeObserver to get the container's true pixel width before
 *   rendering, so the output is always sharp and correctly sized.
 * - Renders at devicePixelRatio × container width for HiDPI sharpness.
 * - Caches the result as a blob URL — no re-render on remount.
 * - Must be loaded with `dynamic(..., { ssr: false })` because pdfjs-dist
 *   requires browser APIs (DOMMatrix, Canvas) unavailable in Node.js.
 */
export default function PdfCoverCanvas({ pdfPath, title }: PdfCoverCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cover, setCover] = useState<CoverState>({ phase: "loading" });
  const renderCover = useCallback(
    async (containerWidth: number) => {
      if (!pdfPath) return;

      // Return cached result immediately
      const cached = coverCache.get(pdfPath);
      if (cached) {
        setCover({ phase: "ready", src: cached });
        return;
      }

      const inFlight = coverRenderInFlight.get(pdfPath);
      if (inFlight) {
        setCover({ phase: "ready", src: await inFlight });
        return;
      }

      const renderPromise = (async () => {
        // Use local worker — copied to public/ by next.config.ts at build time
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const pdf = await pdfjs.getDocument(pdfPath).promise;
        try {
          const page = await pdf.getPage(1);

          // Render at devicePixelRatio for sharpness on HiDPI / Android screens
          const dpr = window.devicePixelRatio || 1;
          const viewport = page.getViewport({ scale: 1 });
          const scale = (containerWidth / viewport.width) * dpr;
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;

          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("No 2d context");

          await page.render({ canvasContext: ctx, canvas, viewport: scaledViewport }).promise;

          // Convert to blob URL — avoids large data URIs, GC-friendly
          const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
              "image/jpeg",
              0.92
            )
          );
          const url = URL.createObjectURL(blob);
          coverCache.set(pdfPath, url);
          return url;
        } finally {
          await pdf.destroy();
        }
      })();
      coverRenderInFlight.set(pdfPath, renderPromise);
      try {
        setCover({ phase: "ready", src: await renderPromise });
      } catch {
        setCover({ phase: "error" });
      } finally {
        coverRenderInFlight.delete(pdfPath);
      }
    },
    [pdfPath]
  );

  useEffect(() => {
    if (!pdfPath) {
      setCover({ phase: "error" });
      return;
    }

    // If already cached, show immediately without waiting for ResizeObserver
    const cached = coverCache.get(pdfPath);
    if (cached) {
      setCover({ phase: "ready", src: cached });
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    // Wait for the container to have a real width before rendering
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) {
        ro.disconnect();
        renderCover(width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [pdfPath, renderCover]);

  useEffect(() => {
    if (!pdfPath) return;

    coverConsumers.set(pdfPath, (coverConsumers.get(pdfPath) ?? 0) + 1);
    return () => {
      const remaining = (coverConsumers.get(pdfPath) ?? 1) - 1;
      if (remaining > 0) {
        coverConsumers.set(pdfPath, remaining);
        return;
      }

      coverConsumers.delete(pdfPath);
      // Defer revoke so React Strict Mode can re-acquire a cache entry during
      // its development-only effect replay.
      window.setTimeout(() => {
        if (coverConsumers.has(pdfPath)) return;
        const cached = coverCache.get(pdfPath);
        if (!cached) return;
        URL.revokeObjectURL(cached);
        coverCache.delete(pdfPath);
      }, 0);
    };
  }, [pdfPath]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-3xl overflow-hidden shadow-lg bg-neutral-100"
      style={{ aspectRatio: "3 / 4" }}
    >
      {/* Loading skeleton */}
      {cover.phase === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-100">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-xs font-semibold text-neutral-400">Memuat cover...</p>
        </div>
      )}

      {/* Rendered cover */}
      {cover.phase === "ready" && (
        <img
          src={cover.src}
          alt={`Cover ${title}`}
          className="h-full w-full object-contain"
          loading="eager"
          decoding="async"
        />
      )}

      {/* Error state — no broken icon, no empty blue box */}
      {cover.phase === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary-50 to-primary-100 px-6 text-center">
          <span className="text-5xl">📚</span>
          <p className="text-sm font-bold text-primary-700">{title}</p>
          <p className="text-xs text-primary-500">Cover tidak tersedia</p>
        </div>
      )}
    </div>
  );
}
