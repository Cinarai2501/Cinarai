"use client";

import { memo, type ReactNode } from "react";
import { Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface PdfPageProps {
  pageNumber: number;
  width: number;
  scale?: number;
  loading?: ReactNode;
  onLoadSuccess?: (page: { width: number; height: number }) => void;
  onRenderSuccess?: () => void;
}

function PdfPage({ pageNumber, width, scale = 1, loading, onLoadSuccess, onRenderSuccess }: PdfPageProps) {
  const safeWidth = width > 0 ? width : undefined;

  return (
    <div className="w-full max-w-full overflow-hidden">
      <Page
        pageNumber={pageNumber}
        width={safeWidth}
        scale={scale}
        loading={loading}
        onLoadSuccess={onLoadSuccess}
        onRenderSuccess={onRenderSuccess}
        renderAnnotationLayer={false}
        renderTextLayer={false}
      />
    </div>
  );
}

export default memo(PdfPage);
