import type * as Core from '../../core-viewers'

/** An entry in the BIM info panel: a key-value pair in a header or body section. */
export type Entry = {
  /** The key of the entry, often used as a label or an identifier for the data. */
  key: string | undefined
  /** The label or display name for the entry, shown to the user. */
  label: string | undefined
  /** The value of the entry, displayed to the user. */
  value: string | undefined
}

/** A group of entries within a body section of the BIM info panel. */
export type Group = {
  /** The unique identifier for this group. */
  key: string | undefined
  /** The title displayed for this group. */
  title: string | undefined
  /** The entries that belong to this group. */
  content: Entry[]
}

/** A section of the body, containing one or more groups of entries. */
export type Section = {
  /** The unique identifier for this section. */
  key: string | undefined
  /** The title displayed for this section. */
  title: string
  /** The groups this section contains. */
  content: Group[]
}

/** The entire data set for the BIM info panel: header and body sections. */
export type Data = {
  /** The header, typically a list of entries summarizing key information. */
  header: Entry[] | undefined
  /** The body, typically one or more sections of grouped entries. */
  body: Section[] | undefined
}

/**
 * Customizes the panel data before rendering: transform, filter or augment
 * the data pulled from the vim or element.
 *
 * @param data The data to customize.
 * @param source The vim or element the data was extracted from.
 */
export type DataCustomization = (data: Data, source: Core.Webgl.IWebglVim | Core.Webgl.IElement3D) => Promise<Data>

/**
 * Render override for one part of the BIM info panel: receives the data and
 * the standard renderer, returns the DOM to show instead.
 */
export type DataRender<T> = ((props: { data: T, standard: () => Element }) => Element) | undefined

/**
 * Customization callbacks for the BIM info panel. Assign at runtime; they are
 * read the next time the panel loads data (`BimInfoPanelHandle.refresh()`
 * re-runs it on demand).
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
}

/** A BIM info api with pass-through defaults. */
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
