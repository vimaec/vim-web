// The positioning math is shared with the DS layer (its imperative `floatAbove`);
// only the React hook lives here. Direct import: this file goes away at the flip.
import { computeFloatingPosition } from '../../dom-viewers/helpers/floating'
export { computeFloatingPosition }

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