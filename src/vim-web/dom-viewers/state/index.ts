/**
 * The observable primitives a host writes its own state in. The framing, section box, isolation,
 * ui and tool state builders are the viewer roots' own wiring — a host reads and writes that state
 * through the viewer's `FramingApi`, `IsolationApi`, `SectionBoxApi` and `ui` instead.
 */
export { createSettingState, type SettingStateOptions } from './settingState'
