export function getResponsivePageSize({
  pdfWidth,
  pdfHeight,
  availableWidth,
  availableHeight,
}: {
  pdfWidth: number;
  pdfHeight: number;
  availableWidth: number;
  availableHeight: number;
}): { width: number; height: number } {
  if (!Number.isFinite(pdfWidth) || pdfWidth <= 0 || !Number.isFinite(pdfHeight) || pdfHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const maxWidth = Math.max(1, availableWidth || 1);
  const maxHeight = Math.max(1, availableHeight || maxWidth * (pdfHeight / pdfWidth));

  const widthScale = maxWidth / pdfWidth;
  const heightScale = maxHeight / pdfHeight;
  const scale = Math.min(widthScale, heightScale, 1);

  const width = Math.max(1, Math.round(pdfWidth * scale));
  const height = Math.max(1, Math.round(pdfHeight * scale));

  return { width, height };
}
