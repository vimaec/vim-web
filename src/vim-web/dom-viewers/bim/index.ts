/**
 * What a host can build a BIM experience from. The widgets that make up the Project Inspector —
 * the grouping strip, the search row, the ROWS stepper, the preset picker, Export — are not here:
 * each exists to serve its one call site inside the panel, and exporting them would freeze an
 * option shape written for that call site.
 */

// The tree and the data model behind it, for an inspector that is not ours. `toTreeData` takes the
// elements `getElements(vim)` returns.
export { bimTree, type BimTreeHandle, type BimTreeOptions } from './bimTree'
export {
  toTreeData,
  DEFAULT_GROUPING,
  BimTreeData,
  type BimNode,
  type GroupingColumn,
  type SortSetting
} from './bimTreeData'

// The Parameters view, and the id it registers under, so a host can open or replace it.
export { parametersView, PARAMETERS_VIEW } from './parametersView'

// The BIM info panel's data contract — what `viewer.bimInfo` is customized through.
export type {
  BimInfoPanelApi,
  DataRender,
  Data,
  Entry,
  Group,
  Section,
  DataCustomization
} from './bimInfoApi'
