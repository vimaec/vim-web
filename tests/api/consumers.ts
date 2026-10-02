/**
 * Every vim-web API the two consuming repositories touch, written against the current surface.
 *
 * `vim-web-demo` and `vim-powerbi-visual` sit beside this repository and are its only consumers.
 * Both still compile against the React UI, which this branch removed, so both need porting — and
 * what this file guards is that there is something to port *to*: every call they make has a home
 * on the Dom surface. It is type-checked by `npm run check:consumers`, never run.
 *
 * Nothing here is example code. It is an inventory, and a line that stops compiling is a line one
 * of those repositories can no longer write.
 */
import * as VIM from '../../src/vim-web'

declare const div: HTMLDivElement
declare const box: VIM.THREE.Box3
declare const token: string

// ---------------------------------------------------------------------------
// Both repositories: the viewer roots and the settings they are given
// ---------------------------------------------------------------------------

export async function roots () {
  const webgl: VIM.Dom.Webgl.ViewerApi = await VIM.Dom.Webgl.createViewer(div)
  const ultra: VIM.Dom.Ultra.ViewerApi = await VIM.Dom.Ultra.createViewer(div)

  // vim-powerbi-visual/src/settings.ts builds a partial settings object.
  const partial: VIM.Dom.Webgl.PartialWebglSettings = {
    ui: { panelBimTree: false, panelLogo: 'AlwaysFalse' },
    capacity: { canDownload: false }
  }
  await VIM.Dom.Webgl.createViewer(div, partial)
  const defaults = VIM.Dom.Webgl.getDefaultSettings()
  const ultraDefaults = VIM.Dom.Ultra.getDefaultUltraSettings()

  // A viewer of either kind, discriminated by `type` (both repos hold the union).
  const either: VIM.Dom.ViewerApi = Math.random() > 0.5 ? webgl : ultra
  if (either.type === 'webgl') either.core.camera.snap().frame('all')

  return { webgl, ultra, defaults, ultraDefaults }
}

// ---------------------------------------------------------------------------
// vim-web-demo: loading, camera, selection, rendering
// ---------------------------------------------------------------------------

export async function demoWebgl (viewer: VIM.Dom.Webgl.ViewerApi) {
  // localFile.tsx, zippedFile.tsx, unload.tsx
  const vim = await viewer.load({ url: 'model.vim' }).getVim()
  viewer.load({ buffer: new ArrayBuffer(8) })
  viewer.unload(vim)

  // accessToken.tsx — the header helper both repos use for authenticated sources.
  const headers: Record<string, string> = VIM.Core.authHeaders(token)
  viewer.load({ url: 'model.vim', headers })

  // camera.tsx, planView.tsx
  viewer.core.camera.lerp(1).frame('all')
  viewer.core.camera.snap().orbitTowards(new VIM.THREE.Vector3(0, 0, -1))
  viewer.core.camera.orthographic = true
  viewer.core.camera.lockRotation = new VIM.THREE.Vector2(0, 0)
  viewer.core.inputs.pointerMode = VIM.Core.PointerMode.PAN

  // screenshot.tsx
  viewer.core.renderer.requestRender()
  viewer.core.renderer.render()
  const png: string = viewer.core.renderer.three.domElement.toDataURL('image/png')

  // coloring.tsx, outlines.tsx
  for (const element of vim.getAllElements()) {
    element.color = new VIM.THREE.Color(0xff0000)
    element.visible = true
    element.outline = false
  }

  // isolation.tsx
  viewer.isolation.autoIsolate.set(true)
  viewer.isolation.showGhost.set(true)
  viewer.isolation.ghostOpacity.set(0.1)
  viewer.renderSettings.showRooms.set(false)
  viewer.isolation.isolateSelection()
  viewer.isolation.showAll()

  // sectionBox.tsx — the UI api above, the gizmo below.
  viewer.sectionBox.active.set(true)
  viewer.sectionBox.sectionBox.call(box)
  const current: VIM.THREE.Box3 = viewer.core.gizmos.sectionBox.getBox()
  viewer.core.gizmos.sectionBox.setBox(box)
  viewer.core.gizmos.sectionBox.visible = true
  viewer.core.gizmos.sectionBox.interactive = true
  viewer.core.gizmos.sectionBox.active = true
  viewer.core.gizmos.sectionBox.onStateChanged.subscribe(() => {})

  // home.tsx, customInspector.tsx
  viewer.framing.frameScene.call()
  viewer.core.selection.select(vim.getElementFromIndex(1))
  viewer.core.selection.add(vim.getElementFromIndex(2))
  viewer.core.selection.remove(vim.getElementFromIndex(2))
  const selected: VIM.Core.Webgl.ISelectable[] = viewer.core.selection.getAll()
  const selectionBox = await viewer.core.selection.getBoundingBox()
  viewer.core.selection.onSelectionChanged.subscribe(() => {})
  const vims: VIM.Core.Webgl.IWebglVim[] = viewer.core.vims

  // markers.tsx
  const marker: VIM.Core.Webgl.IMarker = viewer.core.gizmos.markers.add(new VIM.THREE.Vector3())
  viewer.core.gizmos.markers.remove(marker)

  return { png, selected, selectionBox, current, vims }
}

// accessingBim.tsx — the BIM tables and the element records behind them.
export async function demoBim (vim: VIM.Core.Webgl.IWebglVim) {
  const document: VIM.BIM.VimDocument = vim.bim
  const element: VIM.Core.Webgl.IElement3D = vim.getElementFromIndex(1)
  const record: VIM.BIM.IElement = await element.getBimElement()
  const parameters = await element.getBimParameters()
  return { document, record, parameters: parameters.map(p => `${p.name}: ${p.value}`) }
}

// ---------------------------------------------------------------------------
// vim-web-demo: the customization pages
// ---------------------------------------------------------------------------

// customControlBar.tsx
export function demoControlBar (viewer: VIM.Dom.Webgl.ViewerApi) {
  viewer.controlBar.customize(sections => {
    const section = sections.find(s => s.id === VIM.Dom.ControlBar.controlBarIds.measureSpan)
    const button: VIM.Dom.ControlBar.ControlBarButton = {
      id: 'mine',
      tip: 'Mine',
      icon: VIM.Dom.Icons.checkmark,
      action: () => {},
      isOn: () => true,
      variant: 'blue'
    }
    const added: VIM.Dom.ControlBar.ControlBarSection = { id: 'custom', buttons: [button] }
    return section ? [...sections, added] : [added]
  })
}

// customContextMenu.tsx
export function demoContextMenu (viewer: VIM.Dom.Webgl.ViewerApi) {
  viewer.contextMenu.customize(menu => {
    const entry: VIM.Dom.Panels.ContextMenuButton = {
      type: 'button',
      id: 'custom',
      label: 'Custom Action',
      enabled: true,
      action: () => {}
    }
    const divider: VIM.Dom.Panels.ContextMenuDivider = { type: 'divider', id: 'div', enabled: true }
    const keep = menu.filter(e => e.id !== VIM.Dom.Panels.contextMenuIds.showAll)
    return [...keep, divider, entry]
  })
}

// customBimPanel.tsx — the BIM info render overrides and data hook.
export function demoBimInfo (viewer: VIM.Dom.Webgl.ViewerApi) {
  viewer.bimInfo.onData = async (data: VIM.Dom.Bim.Data) => {
    const group: VIM.Dom.Bim.Group = { key: 'g', title: 'Group', content: [{ key: 'f', label: 'Field', value: 'Value' }] }
    const section: VIM.Dom.Bim.Section = { key: 'custom', title: 'Custom', content: [group] }
    data.body?.push(section)
    return data
  }
  viewer.bimInfo.onRenderHeader = ({ data, standard }) => standard()
  viewer.bimInfo.onRenderHeaderEntry = ({ data, standard }) => standard()
  viewer.bimInfo.onRenderHeaderEntryValue = ({ data }: { data: VIM.Dom.Bim.Entry, standard: () => Element }) => {
    const span = document.createElement('span')
    span.textContent = `${data.value} !`
    return span
  }
  viewer.bimInfo.onRenderBodySection = ({ standard }) => standard()
  viewer.bimInfo.onRenderBodyGroup = ({ standard }) => standard()
}

/**
 * customGenericPanels.tsx — in React this customized the floating isolation popover through
 * `viewer.isolationPanel.customize` and `IsolationPanel.Ids`. Those popovers are sections of the
 * Settings view now, so one hook and one id map cover what two used to.
 */
export function demoSettingsView (viewer: VIM.Dom.Webgl.ViewerApi) {
  const state = VIM.Dom.createState(false)
  state.onChange.subscribe(v => console.log(`hello! : ${v}`))

  viewer.views.open(VIM.Dom.Settings.SETTINGS_VIEW)
  viewer.settingsView.customize(entries => {
    const ghost = entries.find(e => e.id === VIM.Dom.Settings.settingsIds.showGhost)
    if (ghost && 'label' in ghost) ghost.label += ' (custom)'

    const kept = entries.filter(e => e.id !== VIM.Dom.Settings.settingsIds.ghostOpacity)
    const mine: VIM.Dom.Generic.GenericBoolEntry = {
      type: 'bool',
      id: 'custom-button',
      label: 'CUSTOM BUTTON',
      state,
      enabled: () => true
    }
    return [...kept, mine]
  })
}

// customInputs.tsx — every binding is an `override` that hands back a restore function.
export function demoInputs (viewer: VIM.Dom.Webgl.ViewerApi) {
  const restoreKey = viewer.core.inputs.keyboard.override('KeyR', 'down', original => { original?.() })
  const restoreMouse = viewer.core.inputs.mouse.override({
    onClick: (original, pos, ctrl) => original(pos, ctrl)
  })
  const restoreTouch = viewer.core.inputs.touch.override({
    onTap: (original, pos) => original(pos)
  })
  viewer.core.inputs.pointerMode = VIM.Core.PointerMode.ORBIT
  viewer.core.inputs.moveSpeed = 5
  viewer.core.inputs.scrollSpeed = 2
  return () => { restoreKey(); restoreMouse(); restoreTouch() }
}

// ---------------------------------------------------------------------------
// vim-web-demo: Ultra
// ---------------------------------------------------------------------------

export async function demoUltra (viewer: VIM.Dom.Ultra.ViewerApi) {
  // home.tsx connects with the configured server, connectionError.tsx with a bad one.
  await viewer.core.connect()
  void viewer.core.connect({ url: 'ws://invalidServer' })

  const request = viewer.load({ url: 'model.vim' })
  await request.getResult()
  const vim: VIM.Core.Ultra.IUltraVim = await viewer.load({ url: 'model.vim' }).getVim()

  // colors.tsx, ghostColor.tsx, nodeEffects.tsx
  const element = vim.getElementFromIndex(1)
  element.ghosted = true
  element.outline = true
  element.color = new VIM.THREE.Color(0xff0000)
  viewer.core.renderer.ghostColor = new VIM.THREE.Color(1, 0, 0)

  // camera.tsx
  const position = await viewer.core.camera.lerp(1).frame(box)
  viewer.core.camera.save(position)
  viewer.core.camera.snap().reset()
  await viewer.core.camera.snap().frame('all')

  viewer.modal.loading({ source: 'model.vim', progress: 0.5, mode: 'bytes' })
  return vim
}

// ---------------------------------------------------------------------------
// vim-powerbi-visual: its own error screens, in the viewer's own voice
// ---------------------------------------------------------------------------

const Style = VIM.Dom.Errors.style

export function pbiNoGeometryError (): VIM.Dom.Modal.MessageBoxProps {
  return {
    icon: VIM.Dom.Icons.filter({ height: 36, width: 36, fill: '#212733' }),
    title: 'Element Geometry Not Found',
    body: pbiBody(),
    minimize: true,
    canClose: false
  }
}

function pbiBody (): HTMLElement {
  const root = document.createElement('div')
  root.append(
    Style.mainText('The selected elements have no geometry.'),
    Style.subTitle('Tips'),
    Style.numList([
      'Update your selection',
      'Review your filter settings',
      'Ensure your VIM data is not empty'
    ]),
    Style.dotList([Style.bullet('Source:', 'the report'), null]),
    Style.detailText('details'),
    Style.fragment('mixed ', Style.bold('content'))
  )
  return root
}

// The Ultra screens the visual reuses rather than rewriting.
export function pbiUltraErrors (state: VIM.Core.Ultra.ClientState) {
  const message: VIM.Dom.Modal.MessageBoxProps | undefined = VIM.Dom.Errors.getErrorMessage(state)
  const fromFile: VIM.Dom.Modal.MessageBoxProps = VIM.Dom.Errors.webglFileError('model.vim', 'bad header')
  return { message, fromFile }
}

// ---------------------------------------------------------------------------
// vim-powerbi-visual: driving the viewer from report state
// ---------------------------------------------------------------------------

/** shared/*.ts wrap every StateRef in a synchronizer; this is the shape they need. */
export class StateRefSynchronizer<T> {
  constructor (private readonly ref: VIM.Dom.StateRef<T>) {}
  synch (value: T) { this.ref.set(value) }
  read (): T { return this.ref.get() }
}

export function pbiRenderSettings (viewer: VIM.Dom.Webgl.ViewerApi) {
  // All of these moved from `isolation` to `renderSettings` in 1.0.
  return [
    new StateRefSynchronizer(viewer.renderSettings.outlineEnabled),
    new StateRefSynchronizer(viewer.renderSettings.outlineQuality),
    new StateRefSynchronizer(viewer.renderSettings.outlineThickness),
    new StateRefSynchronizer(viewer.renderSettings.selectionFillMode),
    new StateRefSynchronizer(viewer.renderSettings.selectionOverlayOpacity),
    new StateRefSynchronizer(viewer.renderSettings.showTransparent),
    new StateRefSynchronizer(viewer.renderSettings.transparentOpacity),
    new StateRefSynchronizer(viewer.isolation.autoIsolate),
    new StateRefSynchronizer(viewer.isolation.showGhost),
    new StateRefSynchronizer(viewer.isolation.ghostOpacity)
  ]
}

export function pbiAutoIsolate (viewer: VIM.Dom.Webgl.ViewerApi, reapply: () => void) {
  // Was `onAutoIsolate.set(fn)`; a FuncRef is replaced through `update`.
  viewer.isolation.onAutoIsolate.update(() => reapply)
}

export function pbiSectionBox (api: VIM.Dom.SectionBoxApi) {
  api.active.set(true)
  api.visible.set(true)
  api.auto.set(false)
  api.topOffset.set(1)
  api.sideOffset.set(1)
  api.bottomOffset.set(1)
  api.sectionBox.call(box)
  return api.getSelectionBox.call()
}

export function pbiFraming (api: VIM.Dom.FramingApi) {
  api.frameSelection.call()
  api.autoCamera.set(false)
}

export function pbiControlBar (viewer: VIM.Dom.Webgl.ViewerApi) {
  viewer.controlBar.customize(sections => {
    for (const section of sections) {
      for (const button of section.buttons) {
        // Was `ControlBar.Style.buttonDefaultStyle`; the variants are a string union now.
        const variant: VIM.Dom.ControlBar.ButtonVariant = 'default'
        button.variant = variant
      }
      const sectionVariant: VIM.Dom.ControlBar.SectionVariant = 'blue'
      section.variant = sectionVariant
    }
    return sections
  })
}

export function pbiViewer (viewer: VIM.Dom.Webgl.ViewerApi) {
  viewer.modal.message({ title: 'Error', body: 'Something went wrong', canClose: true })
  viewer.modal.loading(undefined)
  viewer.ui.bimTree.set(false)
  viewer.ui.controlBar.set(false)
  viewer.core.viewport.canvas.tabIndex = 0
  viewer.core.viewport.canvas.style.outline = 'none'
  viewer.core.camera.save()
  viewer.core.selection.clear()
  const any: boolean = viewer.core.selection.any()
  const count: number = viewer.core.selection.count()
  viewer.dispose()
  return { any, count }
}
