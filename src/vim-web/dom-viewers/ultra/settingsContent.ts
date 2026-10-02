import { GenericCommonEntry } from '../generic'
import { IsolationApi } from '../api'
import { settingsIds } from '../settings/settingsIds'

/** Ultra settings — only ghost controls are functional server-side. */
export function getUltraSettingsContent(isolation: IsolationApi): GenericCommonEntry[] {
  return [
    {
      type: 'section',
      id: settingsIds.ultraRenderSettingsSection,
      label: 'Render Settings',
    },
    {
      type: 'bool',
      id: settingsIds.showGhost,
      label: 'Show Ghost',
      state: isolation.showGhost,
    },
    {
      type: 'number',
      id: settingsIds.ghostOpacity,
      label: 'Ghost Opacity',
      info: '[0,1]',
      step: 1 / 255,
      transform: (n) => Math.max(0, Math.min(1, n)),
      state: isolation.ghostOpacity,
    },
  ]
}
