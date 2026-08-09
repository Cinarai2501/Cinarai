"use client";

import { memo, type ReactNode } from "react";
import { Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface PdfPageProps {
  pageNumber: number;
  width: number;
  loading?: ReactNode;
  onLoadSuccess?: (page: { width: number; height: number }) => void;
  onRenderSuccess?: () => void;
}

function PdfPage({ pageNumber, width, loading, onLoadSuccess, onRenderSuccess }: PdfPageProps) {
  const safeWidth = width > 0 ? width : undefined;

  return (
    <div className="flex h-full w-full max-w-full items-center justify-center overflow-hidden">
      <Page
        pageNumber={pageNumber}
        width={safeWidth}
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
