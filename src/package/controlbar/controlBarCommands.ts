import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer'

export function getControlBarCommands (viewer: VIM.Viewer) {
  const section = viewer.gizmos.section

  return {
    toggleSectionBox: (viewer: VIM.Viewer) => {
      ReactTooltip.hide()

      if (viewer.inputs.pointerActive === 'rect') {
        viewer.inputs.pointerActive = viewer.inputs.pointerFallback
      }

      const next = !(
        section.visible && section.interactive
      )

      section.interactive = next
      section.visible = next
    }
  }
}
