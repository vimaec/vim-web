/**
 * @fileoverview This file exports types and a React hook for customizing the rendering
 * and data handling of a BIM info panel. The hook provides references for customizing
 * how data is processed and rendered in different sections of the BIM info panel.
 */

import { useState } from 'react'
import * as VIM from '../../core-viewers/webgl/index'

/**
 * Represents an entry in the BIM info panel, such as a key-value pair in a header or body section.
 */
export type Entry = {
  /**
   * The key of the entry, often used as a label or an identifier for the data.
   */
  key: string | undefined;

  /**
   * The label or display name for the entry, shown to the user.
   */
  label: string | undefined;

  /**
   * The value of the entry, displayed to the user.
   */
  value: string | undefined;
}

/**
 * Represents a group of entries within a body section of the BIM info panel.
 */
export type Group = {
  /**
   * The unique identifier for this group.
   */
  key: string | undefined;

  /**
   * The title or name displayed for this group.
   */
  title: string | undefined;

  /**
   * An array of entries that belong to this group.
   */
  content: Entry[];
}

/**
 * Represents a section of the body, containing one or more groups of entries.
 */
export type Section = {
  /**
   * The unique identifier for this section.
   */
  key: string | undefined;

  /**
   * The title displayed for this section.
   */
  title: string;

  /**
   * An array of groups that this section contains.
   */
  content: Group[];
}

/**
 * Represents the entire data set for the BIM info panel, including the header and body sections.
 */
export type Data = {
  /**
   * The header of the BIM info panel, typically a list of entries summarizing key information.
   */
  header: Entry[] | undefined;

  /**
   * The body of the BIM info panel, typically containing one or more sections of grouped entries.
   */
  body: Section[] | undefined;
}

/**
 * A customization function for modifying the panel data before rendering. It allows
 * developers to transform, filter, or augment the data pulled from a VIM source.
 *
 * @param data - The data to customize.
 * @param source - The VIM.Object or VIM.Vim instance from which the data was originally extracted.
 * @returns A promise that resolves to the modified Data object.
 */
export type DataCustomization = (data: Data, source: VIM.WebglVim | VIM.WebglModelObject) => Promise<Data>

/**
 * A rendering customization function that takes props containing data and a standard
 * rendering function, and returns a custom JSX element. This function enables developers
 * to override how data is rendered in different parts of the BIM info panel.
 *
 * @typeParam T - The type of data to render.
 * @param props.data - The data to render.
 * @param props.standard - The standard rendering function for the data.
 * @returns A custom JSX element to render, or `undefined` to use the default rendering.
 */
export type DataRender<T> = ((props: { data: T; standard: () => JSX.Element }) => JSX.Element) | undefined

/**
 * A reference object exposing multiple customization callbacks for transforming data and rendering
 * different parts of the BIM info panel. These callbacks can be updated at runtime and will be used
 * the next time the panel re-renders.
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

/**
 * A React hook that provides a reference object for customizing the data and rendering
 * of a BIM info panel. This hook maintains internal state for each customization callback,
 * allowing dynamic updates at runtime.
 *
 * @returns A {@link BimInfoPanelRef} object containing getters and setters for each customization callback.
 */
export function useBimInfo(): BimInfoPanelRef {
  const [onData, setOnData] = useState<DataCustomization>(() => async (data, _) => data)
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
    get onData() {
      return onData
    },
    set onData(value: DataCustomization) {
      setOnData(() => value)
    },

    // onRenderBody
    get onRenderBody() {
      return renderBody
    },
    set onRenderBody(value: DataRender<Section[]>) {
      setRenderBody(() => value)
    },

    // onRenderHeader
    get onRenderHeader() {
      return renderHeader
    },
    set onRenderHeader(value: DataRender<Entry[]>) {
      setRenderHeader(() => value)
    },

    // onRenderHeaderEntry
    get onRenderHeaderEntry() {
      return renderHeaderEntry
    },
    set onRenderHeaderEntry(value: DataRender<Entry>) {
      setRenderHeaderEntry(() => value)
    },

    // onRenderHeaderEntryValue
    get onRenderHeaderEntryValue() {
      return renderHeaderEntryValue
    },
    set onRenderHeaderEntryValue(value: DataRender<Entry>) {
      setRenderHeaderEntryValue(() => value)
    },

    // onRenderBodySection
    get onRenderBodySection() {
      return renderBodySection
    },
    set onRenderBodySection(value: DataRender<Section>) {
      setRenderBodySection(() => value)
    },

    // onRenderBodyGroup
    get onRenderBodyGroup() {
      return renderBodyGroup
    },
    set onRenderBodyGroup(value: DataRender<Group>) {
      setRenderBodyGroup(() => value)
    },

    // onRenderBodyEntry
    get onRenderBodyEntry() {
      return renderBodyEntry
    },
    set onRenderBodyEntry(value: DataRender<Entry>) {
      setRenderBodyEntry(() => value)
    },

    // onRenderBodyEntryValue
    get onRenderBodyEntryValue() {
      return renderBodyEntryValue
    },
    set onRenderBodyEntryValue(value: DataRender<Entry>) {
      setRenderBodyEntryValue(() => value)
    }
  }
}
