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
  const maxHeight = Number.isFinite(availableHeight) && availableHeight > 0 ? Math.max(1, availableHeight) : Number.POSITIVE_INFINITY;
  const widthFromAvailable = Math.min(pdfWidth, maxWidth);
  const heightFromAvailableWidth = (pdfHeight / pdfWidth) * widthFromAvailable;

  if (heightFromAvailableWidth <= maxHeight) {
    return {
      width: Math.round(widthFromAvailable),
      height: Math.max(1, Math.round(heightFromAvailableWidth)),
    };
  }

  const constrainedHeight = Math.max(1, Math.min(pdfHeight, maxHeight));
  const widthFromAvailableHeight = (pdfWidth / pdfHeight) * constrainedHeight;

  return {
    width: Math.max(1, Math.round(widthFromAvailableHeight)),
    height: Math.round(constrainedHeight),
  };
}
