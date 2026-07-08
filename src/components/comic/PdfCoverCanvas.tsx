"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { pdfjs } from "react-pdf";

/** Module-level cache: pdfPath → blob URL of the rendered cover image */
const coverCache = new Map<string, string>();

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
  const renderingRef = useRef(false);

  const renderCover = useCallback(
    async (containerWidth: number) => {
      if (!pdfPath || renderingRef.current) return;

      // Return cached result immediately
      const cached = coverCache.get(pdfPath);
      if (cached) {
        setCover({ phase: "ready", src: cached });
        return;
      }

      renderingRef.current = true;

      try {
        // Use local worker — copied to public/ by next.config.ts at build time
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const pdf = await pdfjs.getDocument(pdfPath).promise;
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
        setCover({ phase: "ready", src: url });
      } catch {
        setCover({ phase: "error" });
      } finally {
        renderingRef.current = false;
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
