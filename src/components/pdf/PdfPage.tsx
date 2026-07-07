"use client";

import type { ReactNode } from "react";
import { Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface PdfPageProps {
  pageNumber: number;
  width: number;
  scale?: number;
  loading?: ReactNode;
}

export default function PdfPage({ pageNumber, width, scale = 1, loading }: PdfPageProps) {
  const safeWidth = width > 0 ? width : undefined;

  return (
    <div className="w-full max-w-full overflow-hidden">
      <Page
        pageNumber={pageNumber}
        width={safeWidth}
        scale={scale}
        loading={loading}
        renderAnnotationLayer={false}
        renderTextLayer={false}
      />
    </div>
  );
}
