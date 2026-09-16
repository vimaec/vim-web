import type * as Core from '../../core-viewers'
// Pure data types; the module moves into this layer at the flip.
import type { Data, Entry, Group, Section, DataCustomization } from '../../react-viewers/bim/bimInfoData'

export type { Data, Entry, Group, Section, DataCustomization }

/**
 * Render override for one part of the BIM info panel: receives the data and
 * the standard renderer, returns the DOM to show instead. The React version
 * returned JSX (public-API break, see DS_PORT.md).
 */
export type DataRender<T> = ((props: { data: T, standard: () => Element }) => Element) | undefined

/**
 * Customization callbacks for the BIM info panel. Assign at runtime; they are
 * read the next time the panel loads data (`BimInfoPanelHandle.refresh()`
 * re-runs it on demand). Same contract as the React `BimInfoPanelApi`.
 */
export type BimInfoPanelApi = {
  /** Transforms the data before it is rendered. */
  onData: DataCustomization
  onRenderHeader: DataRender<Entry[]>
  onRenderHeaderEntry: DataRender<Entry>
  onRenderHeaderEntryValue: DataRender<Entry>
  onRenderBody: DataRender<Section[]>
  onRenderBodySection: DataRender<Section>
  onRenderBodyGroup: DataRender<Group>
  onRenderBodyEntry: DataRender<Entry>
  onRenderBodyEntryValue: DataRender<Entry>
  source?: Core.Webgl.IWebglVim | Core.Webgl.IElement3D
}

/** The framework-neutral twin of `useBimInfo`: a plain object with pass-through defaults. */
export function createBimInfoApi (): BimInfoPanelApi {
  return {
    onData: async data => data,
    onRenderHeader: undefined,
    onRenderHeaderEntry: undefined,
    onRenderHeaderEntryValue: undefined,
    onRenderBody: undefined,
    onRenderBodySection: undefined,
    onRenderBodyGroup: undefined,
    onRenderBodyEntry: undefined,
    onRenderBodyEntryValue: undefined
  }
}
