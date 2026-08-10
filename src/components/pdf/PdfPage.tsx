"use client";

import { memo, type ReactNode } from "react";
import { Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface PdfPageProps {
  pageNumber: number;
  width: number;
  loading?: ReactNode;
  error?: ReactNode;
  onLoadSuccess?: (page: { width: number; height: number }) => void;
  onLoadError?: (error: Error) => void;
  onRenderSuccess?: () => void;
}

function PdfPage({ pageNumber, width, loading, error, onLoadSuccess, onLoadError, onRenderSuccess }: PdfPageProps) {
  return (
    <div className="flex h-full w-full max-w-full items-center justify-center overflow-hidden">
      <Page
        key={pageNumber}
        pageNumber={pageNumber}
        width={width}
        loading={loading}
        error={error}
        onLoadSuccess={onLoadSuccess}
        onLoadError={onLoadError}
        onRenderSuccess={onRenderSuccess}
        renderAnnotationLayer={false}
        renderTextLayer={false}
      />
    </div>
  );
}

export default memo(PdfPage);
