import { useState } from 'react'
import * as VIM from 'vim-webgl-viewer'

export type Entry = {
  key: string | undefined
  label: string | undefined
  value: string | undefined
}

export type Group = {
  key: string | undefined
  title: string | undefined
  content: Entry[]
}

export type Section = {
  key: string | undefined
  title: string
  content: Group[]
}

export type Data = {
  header: Entry[] | undefined
  body : Section[] | undefined
}

/**
 * Data customization function for the BIM info panel.
 * @data The data to customize.
 * @source The VIM.Object or VIM.Vim from which the data was pulled.
 */
export type DataCustomization = (data: Data, source: VIM.Vim | VIM.Object) => Promise<Data>

/**
 * Rendering customization function for the BIM info panel.
 * @data The data to render.
 * @standard The standard rendering function for the data.
 */
export type DataRender<T> = ((props:{ data: T, standard:() => JSX.Element }) => JSX.Element) | undefined

/**
 * Reference object for customizing the rendering of the BIM info panel.
 */
export type BimInfoPanelRef = {
  /**
   * A function that customizes the data before it is rendered in the BIM info panel.
   */
  onData: DataCustomization;

  /**
   * A function that customizes the rendering of the header of the BIM info panel.
   */
  onRenderHeader: DataRender<Entry[]>;

  /**
   * A function that customizes the rendering of each header entry in the BIM info panel.
   */
  onRenderHeaderEntry: DataRender<Entry>;

  /**
   * A function that customizes the rendering of each entry value of the header in the BIM info panel.
   */
  onRenderHeaderEntryValue: DataRender<Entry>;

  /**
   * A function that customizes the rendering for the body section of the BIM info panel.
   */
  onRenderBody: DataRender<Section[]>;

  /**
   * A function that customizes the rendering of each section of the body in the BIM info panel.
   */
  onRenderBodySection: DataRender<Section>;

  /**
   * A function that customizes the rendering of each group of the body in the BIM info panel.
   */
  onRenderBodyGroup: DataRender<Group>;

  /**
   * A function that customizes the rendering for each entry of the body in the BIM info panel.
   */
  onRenderBodyEntry: DataRender<Entry>;

  /**
   * A function that customizes the rendering of each value for a single body entry in the info panel.
   */
  onRenderBodyEntryValue: DataRender<Entry>;
};

export function createBimInfoState () : BimInfoPanelRef {
  // Double lambda to avoid react reducer pattern
  const [onData, setOnData] = useState<DataCustomization>(() => (data, _) => data)
  const [renderHeader, setRenderHeader] = useState<DataRender<Entry[]>>(undefined)
  const [renderHeaderEntry, setRenderHeaderEntry] = useState<DataRender<Entry>>(undefined)
  const [renderHeaderEntryValue, setRenderHeaderEntryValue] = useState<DataRender<Entry>>(undefined)

  const [renderBody, setRenderBody] = useState<DataRender<Section[]>>(undefined)
  const [renderBodySection, setRenderBodySection] = useState<DataRender<Section>>(undefined)
  const [renderBodyGroup, setRenderBodyGroup] = useState<DataRender<Group>>(undefined)
  const [renderBodyEntry, setRenderBodyEntry] = useState<DataRender<Entry>>(undefined)
  const [renderBodyEntryValue, setRenderBodyEntryValue] = useState<DataRender<Entry>>(undefined)

  return {
    // onData
    get onData () {
      return onData
    },
    set onData (value: DataCustomization) {
      setOnData(() => value)
    },

    // onRenderBody
    get onRenderBody () {
      return renderBody
    },
    set onRenderBody (value: DataRender<Section[]>) {
      setRenderBody(() => value)
    },

    // onRenderHeader
    get onRenderHeader () {
      return renderHeader
    },
    set onRenderHeader (value: DataRender<Entry[]>) {
      setRenderHeader(() => value)
    },

    // onRenderHeaderEntry
    get onRenderHeaderEntry () {
      return renderHeaderEntry
    },
    set onRenderHeaderEntry (value: DataRender<Entry>) {
      setRenderHeaderEntry(() => value)
    },

    // onRenderHeaderEntryValue
    get onRenderHeaderEntryValue () {
      return renderHeaderEntryValue
    },
    set onRenderHeaderEntryValue (value: DataRender<Entry>) {
      setRenderHeaderEntryValue(() => value)
    },

    // onRenderBodySection
    get onRenderBodySection () {
      return renderBodySection
    },
    set onRenderBodySection (value: DataRender<Section>) {
      setRenderBodySection(() => value)
    },

    // onRenderBodyGroup
    get onRenderBodyGroup () {
      return renderBodyGroup
    },
    set onRenderBodyGroup (value: DataRender<Group>) {
      setRenderBodyGroup(() => value)
    },

    // onRenderBodyEntry
    get onRenderBodyEntry () {
      return renderBodyEntry
    },
    set onRenderBodyEntry (value: DataRender<Entry>) {
      setRenderBodyEntry(() => value)
    },

    // onRenderBodyEntryValue
    get onRenderBodyEntryValue () {
      return renderBodyEntryValue
    },
    set onRenderBodyEntryValue (value: DataRender<Entry>) {
      setRenderBodyEntryValue(() => value)
    }
  }
}
