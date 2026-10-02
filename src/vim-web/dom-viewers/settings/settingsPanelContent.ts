import { settingsIds } from './settingsIds'
import { GenericCommonEntry } from '../generic'
import { RenderSettingsApi } from '../api'
import { IsolationApi } from '../api'

export function getIsolationSettings(isolation: IsolationApi, renderSettings: RenderSettingsApi): GenericCommonEntry[] {
  return [
    {
      type: 'section',
      id: settingsIds.renderSettingsSection,
      label: 'Render Settings',
    },
    {
      type: 'bool',
      id: settingsIds.showTransparent,
      label: 'Show Transparent',
      state: renderSettings.showTransparent,
    },
    {
      type: 'number',
      id: settingsIds.transparentOpacity,
      label: 'Transparent Opacity',
      info: '[0,1]',
      step: 0.05,
      transform: (n) => Math.max(0, Math.min(1, n)),
      state: renderSettings.transparentOpacity,
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
      // A readable percent-scale step; the DS stepper formats to the step's decimals, and 1/255
      // (a byte-alpha artifact) would print 0.130000.
      step: 0.01,
      transform: (n) => Math.max(0, Math.min(1, n)),
      state: isolation.ghostOpacity,
    },
    {
      type: 'bool',
      id: settingsIds.outlineEnabled,
      label: 'Selection Outline',
      state: renderSettings.outlineEnabled,
    },
    {
      type: 'select',
      id: settingsIds.outlineQuality,
      label: 'Outline Quality',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
      state: renderSettings.outlineQuality,
    },
    {
      type: 'number',
      id: settingsIds.outlineThickness,
      label: 'Outline Thickness',
      info: '[1,5]',
      transform: (n) => Math.max(1, Math.min(5, Math.round(n))),
      state: renderSettings.outlineThickness,
    },
    {
      type: 'select',
      id: settingsIds.selectionFillMode,
      label: 'Selection Fill',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Default', value: 'default' },
        { label: 'X-Ray', value: 'xray' },
        { label: 'See-Through', value: 'seethrough' },
      ],
      state: renderSettings.selectionFillMode,
    },
    {
      type: 'number',
      id: settingsIds.selectionOverlayOpacity,
      label: 'Selection Opacity',
      info: '[0,1]',
      transform: (n) => Math.max(0, Math.min(1, n)),
      state: renderSettings.selectionOverlayOpacity,
    },
  ]
}
