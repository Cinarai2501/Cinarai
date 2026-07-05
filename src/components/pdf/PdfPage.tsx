import type { ReactNode } from "react";
import { Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface PdfPageProps {
  pageNumber: number;
  width: number;
  loading?: ReactNode;
}

export default function PdfPage({ pageNumber, width, loading }: PdfPageProps) {
  return (
    <Page
      pageNumber={pageNumber}
      width={width > 0 ? width : undefined}
      loading={loading}
      renderAnnotationLayer={false}
      renderTextLayer={false}
    />
  );
}
