import { SettingsPanelKeys } from './settingsKeys'
import { GenericEntryType } from '../generic/genericField'
import { IsolationApi } from '../state/sharedIsolation'

export function getIsolationSettings(isolation: IsolationApi): GenericEntryType[] {
  return [
    {
      type: 'subtitle',
      id: SettingsPanelKeys.ControlBarVisibilitySubtitle,
      label: 'Render Settings',
    },
    {
      type: 'bool',
      id: 'transparency',
      label: 'Transparency',
      state: isolation.transparency,
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
      transform: (n) => Math.max(0.01, Math.min(1, n)),
      state: isolation.ghostOpacity,
    },
    {
      type: 'bool',
      id: 'outlineEnabled',
      label: 'Selection Outline',
      state: isolation.outlineEnabled,
    },
    {
      type: 'select',
      id: 'outlineQuality',
      label: 'Outline Quality',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
      state: isolation.outlineQuality,
    },
    {
      type: 'number',
      id: 'outlineThickness',
      label: 'Outline Thickness',
      info: '[1,5]',
      transform: (n) => Math.max(1, Math.min(5, Math.round(n))),
      state: isolation.outlineThickness,
    },
    {
      type: 'select',
      id: 'selectionFillMode',
      label: 'Selection Fill',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Default', value: 'default' },
        { label: 'X-Ray', value: 'xray' },
        { label: 'See-Through', value: 'seethrough' },
      ],
      state: isolation.selectionFillMode,
    },
    {
      type: 'number',
      id: 'selectionOverlayOpacity',
      label: 'Selection Opacity',
      info: '[0,1]',
      transform: (n) => Math.max(0, Math.min(1, n)),
      state: isolation.selectionOverlayOpacity,
    },
  ]
}
