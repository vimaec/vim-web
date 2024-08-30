import { useEffect, useState, useRef } from 'react'
import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer/'

export type SectionState = {
  clip: boolean
  active: boolean
}

export function getSectionBoxState (viewer: VIM.Viewer) {
  const sectionGizmo = viewer.gizmos.section

  const first = useRef(true)
  const [section, setSection] = useState<SectionState>({
    clip: sectionGizmo.clip,
    active: sectionGizmo.visible && sectionGizmo.interactive
  })

  // On First Render
  useEffect(() => {
    sectionGizmo.clip = true
    const subSection = sectionGizmo.onStateChanged.subscribe(() =>
      setSection({
        clip: sectionGizmo.clip,
        active: sectionGizmo.visible && sectionGizmo.interactive
      })
    )

    // Clean up
    return () => subSection()
  }, [])

  const toggle = () => {
    ReactTooltip.hide()

    if (viewer.inputs.pointerActive === 'rect') {
      viewer.inputs.pointerActive = viewer.inputs.pointerFallback
    }

    const next = !(
      sectionGizmo.visible && sectionGizmo.interactive
    )

    sectionGizmo.interactive = next
    sectionGizmo.visible = next

    if (next && first.current) {
      sectionGizmo.fitBox(viewer.renderer.getBoundingBox())
      first.current = false
    }
  }

  return {
    clip: section.clip,
    active: section.active,
    set: setSection,
    toggle,
    hide: () => {
      sectionGizmo.visible = false
      sectionGizmo.interactive = false
    },
    reset: () => sectionGizmo.fitBox(viewer.renderer.getBoundingBox()),
    shrinkToSelection: () => sectionGizmo.fitBox(viewer.selection.getBoundingBox()),
    toggleClip: () => { sectionGizmo.clip = (!section.clip) }
  }
}
