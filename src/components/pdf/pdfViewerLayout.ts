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

  const mobileWidthBudget = Math.max(220, availableWidth || 1);
  const widthFromAvailable = Math.min(pdfWidth, mobileWidthBudget);
  const heightFromAvailableWidth = (pdfHeight / pdfWidth) * widthFromAvailable;
  const maxHeight = Number.isFinite(availableHeight) && availableHeight > 0 ? Math.max(1, availableHeight) : Number.POSITIVE_INFINITY;

  if (heightFromAvailableWidth <= maxHeight) {
    return {
      width: Math.round(widthFromAvailable),
      height: Math.max(1, Math.round(heightFromAvailableWidth)),
    };
  }

  const constrainedHeight = Math.max(1, Math.min(pdfHeight, maxHeight));
  const widthFromAvailableHeight = (pdfWidth / pdfHeight) * constrainedHeight;

  return {
    width: Math.max(1, Math.round(Math.min(widthFromAvailableHeight, widthFromAvailable))),
    height: Math.round(constrainedHeight),
  };
}
