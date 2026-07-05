import { useCallback, useEffect, useRef, useState } from "react";

export function usePdfSize<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const updateContainerWidth = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;

    setContainerWidth(Math.max(0, Math.floor(element.clientWidth)));
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(() => {
      updateContainerWidth();
    });

    resizeObserver.observe(element);
    updateContainerWidth();

    const handleResize = () => updateContainerWidth();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [updateContainerWidth]);

  return { containerRef, containerWidth };
}
