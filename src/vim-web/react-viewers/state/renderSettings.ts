import { StateRef, useStateRef } from '../helpers/reactUtils'

/**
 * Render settings API — controls outline, transparency, selection fill, and rooms.
 * WebGL-only. Ultra does not create this (server handles rendering).
 *
 * @example
 * viewer.renderSettings.outlineEnabled.set(false)
 * viewer.renderSettings.selectionFillMode.set('xray')
 */
export interface RenderSettingsApi {
  /** Whether transparent materials are rendered (observable). */
  showTransparent: StateRef<boolean>
  /** Opacity of transparent materials 0-1 (observable). */
  transparentOpacity: StateRef<number>
  /** Whether selection outlines are enabled (observable). */
  outlineEnabled: StateRef<boolean>
  /** Outline quality: 'low' (0.5x) | 'medium' (1x) | 'high' (2x) render target scale. */
  outlineQuality: StateRef<string>
  /** Outline thickness in screen pixels (1-5). */
  outlineThickness: StateRef<number>
  /** Selection fill mode: 'none' | 'default' | 'xray' | 'seethrough' (observable). */
  selectionFillMode: StateRef<string>
  /** Opacity of the overlay pass in 'xray' and 'seethrough' modes (0-1). */
  selectionOverlayOpacity: StateRef<number>
  /** Whether room elements are shown (observable). */
  showRooms: StateRef<boolean>
}

export interface IRenderSettingsAdapter {
  getShowTransparent(): boolean
  setShowTransparent(enabled: boolean): void
  getTransparentOpacity(): number
  setTransparentOpacity(opacity: number): void
  getOutlineEnabled(): boolean
  setOutlineEnabled(enabled: boolean): void
  getOutlineQuality(): string
  setOutlineQuality(quality: string): void
  getOutlineThickness(): number
  setOutlineThickness(thickness: number): void
  getSelectionFillMode(): string
  setSelectionFillMode(mode: string): void
  getSelectionOverlayOpacity(): number
  setSelectionOverlayOpacity(opacity: number): void
  getShowRooms(): boolean
  setShowRooms(show: boolean): void
}

export function useRenderSettings(adapter: IRenderSettingsAdapter): RenderSettingsApi {
  const showTransparent = useStateRef<boolean>(() => adapter.getShowTransparent(), true)
  const transparentOpacity = useStateRef<number>(() => adapter.getTransparentOpacity(), true, 'vim.transparent.opacity')
  const outlineEnabled = useStateRef<boolean>(() => adapter.getOutlineEnabled(), true, 'vim.outline.enabled')
  const outlineQuality = useStateRef<string>(() => adapter.getOutlineQuality(), true, 'vim.outline.quality')
  const outlineThickness = useStateRef<number>(() => adapter.getOutlineThickness(), true, 'vim.outline.thickness')
  const selectionFillMode = useStateRef<string>(() => adapter.getSelectionFillMode(), true, 'vim.selection.fillMode')
  const selectionOverlayOpacity = useStateRef<number>(() => adapter.getSelectionOverlayOpacity(), true, 'vim.selection.overlayOpacity')
  const showRooms = useStateRef<boolean>(() => adapter.getShowRooms(), true)

  showTransparent.useOnChange((v) => adapter.setShowTransparent(v))
  transparentOpacity.useOnChange((v) => adapter.setTransparentOpacity(v))
  outlineEnabled.useOnChange((v) => adapter.setOutlineEnabled(v))
  outlineQuality.useOnChange((v) => adapter.setOutlineQuality(v))
  outlineThickness.useOnChange((v) => adapter.setOutlineThickness(v))
  selectionFillMode.useOnChange((v) => adapter.setSelectionFillMode(v))
  selectionOverlayOpacity.useOnChange((v) => adapter.setSelectionOverlayOpacity(v))
  showRooms.useOnChange((v) => adapter.setShowRooms(v))

  return {
    showTransparent,
    transparentOpacity,
    outlineEnabled,
    outlineQuality,
    outlineThickness,
    selectionFillMode,
    selectionOverlayOpacity,
    showRooms,
  }
}
