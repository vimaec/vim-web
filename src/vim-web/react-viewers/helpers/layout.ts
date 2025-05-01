/**
 * Computes a position for a floating element relative to a target, with smart fallback
 * if it overflows the top or sides of the screen.
 *
 * @param originRect - The bounding rect of the origin element.
 * @param panelRect - The bounding rect of the panel to position.
 * @returns The top-left position for the panel.
 */
export function computeFloatingPosition(originRect: DOMRect, panelRect: DOMRect): { top: number; left: number } {
  // Center horizontally above the origin
  let left = originRect.left + originRect.width / 2 - panelRect.width / 2;
  let top = originRect.top - 10 - panelRect.height;

  // If overflowing on top, position below
  if (top < 10) {
    top = originRect.bottom + 10;
  }

  // Prevent horizontal overflow
  if (left < 10) {
    left = 10;
  } else if (left + panelRect.width > window.innerWidth - 10) {
    left = window.innerWidth - panelRect.width - 10;
  }

  return { top, left };
}

import { useLayoutEffect, useState } from "react";

/**
 * Tracks and computes the screen position of a floating panel relative to a given anchor element.
 *
 * @param panelRef - Ref to the panel element to position
 * @param anchorElement - The element the panel should be positioned relative to
 * @param enabled - Whether the positioning logic is active
 * @returns The top-left screen position for the panel
 */
export function useFloatingPanelPosition(
  panelRef: React.RefObject<HTMLElement>,
  anchorElement: HTMLElement | null,
  enabled: boolean
): { top: number; left: number } {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!enabled || !anchorElement || !panelRef.current) return;

    const updatePosition = () => {
      const originRect = anchorElement.getBoundingClientRect();
      const panelRect = panelRef.current!.getBoundingClientRect();
      setPosition(computeFloatingPosition(originRect, panelRect));
    };

    updatePosition();

    const resizeObserver = new ResizeObserver(updatePosition);
    panelRef.current.parentElement && resizeObserver.observe(panelRef.current.parentElement);

    return () => resizeObserver.disconnect();
  }, [anchorElement, enabled]);

  return position;
}