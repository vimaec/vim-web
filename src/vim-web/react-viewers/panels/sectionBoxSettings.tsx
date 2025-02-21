import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Icons } from ".."
import { SectionBoxRef } from "../state/sharedSectionBoxState"

export function SectionBoxSettings(props: { state: SectionBoxRef }) {


  // State to hold the position of the panel.
  // Start with a default value that will be quickly updated by useLayoutEffect.
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })

  // useRef for the panel element.
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
      const {top, left} = computePosition(panelRef)
      setPanelPosition({ top, left })
  }, [props.state.getOffsetVisible()])

  if (!props.state.getOffsetVisible()) return null

  // Inline method to render a label-textbox pair.
  const renderField = (
    id: string,
    label: string,
    field: 'topOffset' | 'sideOffset' | 'bottomOffset'
  ) => (
    <div className="vim-sectionbox-offsets-entry vc-text-xs vc-flex vc-items-center">
      <dt className="vc-w-1/2 vc-px-2 vc-py-2 vc-inline">{label}</dt>
      <dd>
        <input
          id={id}
          type="text"
          value={props.state.getText(field)}
          onChange={(e) => props.state.setText(field, e.target.value)}
          className="vc-border vc-inline vc-border-gray-300 vc-px-2 vc-py-1 vc-w-24"
          onBlur={() => props.state.validate(field)}
        />
      </dd>
    </div>
  )

  return (
    <div
      className="vc-fixed vc-inset-0 vc-flex vc-pointer-events-none"
    >
      <div
        ref={panelRef}
        style={{ position: 'absolute', top: panelPosition.top, left: panelPosition.left }}
        className="vim-sectionbox-offsets vc-pointer-events-auto vc-bg-white vc-min-w-[200px] vc-relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="vc-absolute vc-top-1 vc-right-1 vc-border-none vc-bg-transparent vc-text-sm vc-cursor-pointer"
          onClick={() => props.state.setOffsetsVisible(false)}
        >
          {Icons.close({ height: 12, width: 12, fill: 'currentColor' })}
        </button>
        <div>
          <span className="vim-sectionbox-offsets-title vc-bg-gray-light vc-px-2 vc-mb-2 vc-title vc-block">
            Section Box Offsets
          </span>
        </div>
        <dl className="vc-text-xl vc-text-gray-darker vc-mb-4">
          {renderField('topOffset', 'Top Offset', 'topOffset')}
          {renderField('sideOffseet', 'Side Offset', 'sideOffset')}
          {renderField('bottomOffset', 'Bottom Offset', 'bottomOffset')}
        </dl>
      </div>
    </div>
  )
}

function computePosition(panelRef: React.RefObject<HTMLDivElement>) {
  const origin = document.getElementById('vim-control-bar')
    if (origin && panelRef.current) {
      const originRect = origin.getBoundingClientRect()
      const panelRect = panelRef.current.getBoundingClientRect()

      // Calculate horizontal center relative to the section bar.
      let left = originRect.left + (originRect.width / 2) - (panelRect.width / 2)
      // Position the panel 10px above the section bar.
      let top = originRect.top - 10 - panelRect.height

      // Adjust for top overflow: if offscreen on top, position it below the section bar.
      if (top < 10) {
        top = originRect.bottom + 10
      }

      // Adjust for horizontal overflow.
      if (left < 10) {
        left = 10
      }
      if (left + panelRect.width > window.innerWidth - 10) {
        left = window.innerWidth - panelRect.width - 10
      }
      return { top, left }
    }
    return { top: 0, left: 0 }
  }