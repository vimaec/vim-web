/**
 * The public API interfaces of the UI layer in one place: the shapes a
 * consumer holds through `ViewerApi` (framing, section box, isolation, render
 * settings, runtime UI toggles). Widgets import them from here; the
 * implementations live beside their state in `state/`.
 */
export type { FramingApi } from './state/framing'
export type { SectionBoxApi, ISectionBoxAdapter, Offsets, OffsetField } from './state/sectionBox'
export type { IsolationApi, VisibilityStatus, IIsolationAdapter, RenderSettingsApi, IRenderSettingsAdapter } from './state/isolation'
export type { WebglUiApi, UltraUiApi, UiRefs } from './state/uiState'
