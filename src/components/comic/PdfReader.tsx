"use client";

import PdfViewer from "@/components/pdf/PdfViewer";

interface PdfReaderProps {
  pdfPath: string;
  onComplete?: () => void;
  showCompleteButton?: boolean;
  completeButtonLabel?: string;
  completeButtonDisabled?: boolean;
  onPageChange?: (page: number, numPages: number) => void;
}

export default function PdfReader(props: PdfReaderProps) {
  return <PdfViewer {...props} />;
}
