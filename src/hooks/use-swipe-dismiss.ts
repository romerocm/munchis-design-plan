import { useRef, useCallback } from "react";

/**
 * Reusable swipe-to-dismiss for bottom sheets.
 * Returns a ref for the sheet element + touch handlers.
 */
export function useSwipeDismiss(onClose: () => void, threshold = 100) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentDragY = useRef(0);

  const animateClose = useCallback(() => {
    if (!sheetRef.current) {
      onClose();
      return;
    }
    const sheet = sheetRef.current;
    sheet.style.transition = "transform 250ms ease-out, opacity 200ms ease-out";
    sheet.style.transform = "translateY(100%)";
    setTimeout(onClose, 250);
  }, [onClose]);

  function onTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (dragStartY.current === null || !sheetRef.current) return;
    const diff = e.touches[0].clientY - dragStartY.current;
    if (diff > 0) {
      currentDragY.current = diff;
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  }

  function onTouchEnd() {
    if (currentDragY.current > threshold) {
      animateClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transition = "transform 200ms ease-out";
      sheetRef.current.style.transform = "translateY(0)";
    }
    currentDragY.current = 0;
    dragStartY.current = null;
  }

  return { sheetRef, animateClose, onTouchStart, onTouchMove, onTouchEnd };
}
