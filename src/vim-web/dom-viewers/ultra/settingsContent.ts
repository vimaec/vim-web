import { GenericCommonEntry } from '../generic'
import { IsolationApi } from '../api'

/** Ultra settings — only ghost controls are functional server-side. */
export function getUltraSettingsContent(isolation: IsolationApi): GenericCommonEntry[] {
  return [
    {
      type: 'section',
      id: 'ultraRenderSettings',
      label: 'Render Settings',
    },
    {
      type: 'bool',
      id: 'showGhost',
      label: 'Show Ghost',
      state: isolation.showGhost,
    },
    {
      type: 'number',
      id: 'ghostOpacity',
      label: 'Ghost Opacity',
      info: '[0,1]',
      step: 1 / 255,
      transform: (n) => Math.max(0, Math.min(1, n)),
      state: isolation.ghostOpacity,
    },
  ]
}
