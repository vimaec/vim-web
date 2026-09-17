import * as Core from '../../core-viewers'

import { type Container, createContainer } from '../container'
import { createSettings } from '../settings/settingsState'
import { disableLocalStorage } from '../settings/localStorage'
import { isTrue } from '../settings/userBoolean'
import { getDefaultSettings, type PartialWebglSettings, type WebglSettings } from './settings'
import { getWebglSettingsContent } from './settingsContent'
import { applyWebglBindings } from './inputsBindings'
import { CursorManager } from '../helpers/cursor'
import { addPerformanceCounter } from '../panels/performance'

import { bimPanel, createBimInfoApi, type BimPanelHandle } from '../bim'
import { tooltipZone } from '../components'
import { controlBar } from '../controlbar'
import { webglControlBarSections } from '../controlbar/sections'
import { modal } from '../modal'
import {
  axesPanel,
  contextMenu,
  isolationPanel,
  logo,
  overlay,
  restOfScreen,
  sectionBoxPanel,
  sidePanel,
  speedToast
} from '../panels'
import { settingsPanel } from '../settings'
import {
  createFullScreenState,
  createMeasureState,
  createPointerState,
  createSideState,
  createUiRefs,
  createWebglFraming,
  createWebglIsolation,
  createWebglSectionBox,
  createWebglState,
  liveUiSettings,
  webglUiApi
} from '../state'
import { WebglLoader } from './loader'
import type { WebglViewerApi } from './viewerApi'

/**
 * Creates a WebGL viewer with the full DS UI (BIM tree, context menu, control
 * bar, panels). The twin of the React `createWebglViewer`: the same core, the
 * same observable state, imperative DS widgets instead of a React tree.
 *
 * @param container An optional container or DOM element; one is created otherwise.
 * @param settings UI feature toggles (panels, buttons). See {@link WebglSettings}.
 * @param coreSettings Core renderer config (camera, materials, lighting).
 */
export async function createDomWebglViewer (
  container?: Container | HTMLElement,
  settings: PartialWebglSettings = {},
  coreSettings: Core.Webgl.PartialViewerSettings = {}
): Promise<WebglViewerApi> {
  const cmp = container instanceof HTMLElement
    ? createContainer(container)
    : container ?? createContainer()
  // DS components expect a .ds-root ancestor.
  cmp.ui.classList.add('ds-root', 'vim-ds-ui')

  const core = Core.Webgl.createViewer(coreSettings)
  core.viewport.reparent(cmp.gfx)

  const fullSettings = createSettings(settings, getDefaultSettings())
  if (!fullSettings.capacity.canReadLocalStorage) disableLocalStorage()

  // Runtime UI toggles: settings.ui as StateRefs, and a live view for code that takes the settings shape.
  const refs = createUiRefs(fullSettings.ui)
  const ui = webglUiApi(refs)
  const live: WebglSettings = { ...fullSettings, ui: liveUiSettings(refs, fullSettings.ui) }

  const disposers: (() => void)[] = []
  const on = <T>(event: { subscribe (fn: (v: T) => void): () => void }, fn: (v: T) => void) => {
    disposers.push(event.subscribe(fn))
  }

  // ---- state -----------------------------------------------------------------
  const modalHandle = modal()
  const sectionBox = createWebglSectionBox(core, fullSettings.sectionBox)
  const framing = createWebglFraming(core, sectionBox, fullSettings.camera.autoCamera)
  const cursor = new CursorManager(core)
  const loader = new WebglLoader(core, modalHandle)
  const side = createSideState(
    isTrue(live.ui.panelBimTree) || isTrue(live.ui.panelBimInfo),
    Math.min(cmp.root.clientWidth * 0.25, 340)
  )
  const bimInfo = createBimInfoApi()
  const state = createWebglState(core)
  const { isolation, renderSettings } = createWebglIsolation(core, fullSettings.isolation)
  const pointer = createPointerState(core, fullSettings.cursor?.default)
  const measure = createMeasureState(core, cursor)
  const fullScreen = createFullScreenState()

  side.setHasBim(state.vim.get()?.bim !== undefined)
  on(state.vim.onChange, vim => side.setHasBim(vim?.bim !== undefined))
  // The two floating panels are exclusive.
  on(sectionBox.showOffsetPanel.onChange, show => { if (show) isolation.showPanel.set(false) })
  on(isolation.showPanel.onChange, show => { if (show) sectionBox.showOffsetPanel.set(false) })

  // ---- DOM -------------------------------------------------------------------
  const tips = tooltipZone(cmp.ui)

  const performance = document.createElement('div')
  performance.className = 'vim-performance-div'
  cmp.ui.appendChild(performance)
  addPerformanceCounter(performance)
  const syncPerformance = () => performance.classList.toggle('vim-hidden', !refs.panelPerformance.get())
  syncPerformance()
  on(refs.panelPerformance.onChange, syncPerformance)

  const sidePanelHandle = sidePanel(cmp.ui, {
    side,
    root: cmp.root,
    gfx: cmp.gfx,
    resize: () => core.viewport.resizeToParent()
  })
  const settingsPage = settingsPanel(sidePanelHandle.body, {
    entries: getWebglSettingsContent(core, isolation, renderSettings, refs, fullSettings.ui),
    onClose: () => side.popContent()
  })
  const contextMenuHandle = contextMenu({ viewer: core, framing, modal: modalHandle, isolation })
  let bimPage: BimPanelHandle | undefined
  const buildBimPage = () => {
    bimPage?.destroy()
    bimPage = undefined
    if (!isTrue(live.ui.panelBimTree) && !isTrue(live.ui.panelBimInfo)) return
    bimPage = bimPanel(sidePanelHandle.body, {
      viewer: core,
      framing,
      isolation,
      state,
      settings: { panelBimTree: live.ui.panelBimTree, panelBimInfo: live.ui.panelBimInfo },
      bimInfo,
      onClose: () => side.popContent(),
      onContextMenu: position => contextMenuHandle.show(position)
    })
    syncPages()
  }
  const syncPages = () => {
    const content = side.getContent()
    bimPage?.setVisible(content === 'bim')
    settingsPage.setVisible(content === 'settings')
  }
  buildBimPage()
  on(side.onChange, syncPages)
  on(refs.panelBimTree.onChange, buildBimPage)
  on(refs.panelBimInfo.onChange, buildBimPage)

  const rest = restOfScreen(cmp.ui, side)
  on(side.onChange, () => rest.update())
  const overlayHandle = overlay(rest.el, core.viewport.canvas)
  const logoHandle = logo(rest.el)
  const syncLogo = () => { logoHandle.el.hidden = !refs.panelLogo.get() }
  syncLogo()
  on(refs.panelLogo.onChange, syncLogo)

  const sections = () => webglControlBarSections({
    viewer: core, framing, modal: modalHandle, side, settings: live, sectionBox, isolation, pointer, measure, fullScreen
  })
  const bar = controlBar(rest.el, sections())
  const syncBar = () => bar.setVisible(refs.panelControlBar.get())
  syncBar()
  on(refs.panelControlBar.onChange, syncBar)
  // The React bar re-rendered on any state change; re-sync on the same signals.
  const refreshBar = () => bar.update(sections())
  for (const event of [
    pointer.onChange, measure.onChange, fullScreen.onChange, side.onChange,
    isolation.visibility.onChange, isolation.autoIsolate.onChange, isolation.showPanel.onChange,
    sectionBox.active.onChange, sectionBox.visible.onChange, sectionBox.auto.onChange, sectionBox.showOffsetPanel.onChange,
    framing.autoCamera.onChange, core.selection.onSelectionChanged, core.renderer.onSceneUpdated,
    ...Object.values(refs).map(r => r.onChange)
  ] as { subscribe (fn: (...args: unknown[]) => void): () => void }[]) disposers.push(event.subscribe(refreshBar))

  const sectionBoxPanelHandle = sectionBoxPanel(rest.el, { sectionBox, anchor: () => bar.el })
  const isolationPanelHandle = isolationPanel(rest.el, { isolation, renderSettings, anchor: () => bar.el })
  const axes = axesPanel(rest.el, { viewer: core, framing, settings: live.ui })
  const syncAxes = () => {
    const show = refs.panelAxes.get()
    axes.setVisible(show)
    core.gizmos.axes.canvas.style.display = show ? '' : 'none'
  }
  syncAxes()
  on(refs.panelAxes.onChange, syncAxes)

  const toast = speedToast(core)

  // ---- inputs ----------------------------------------------------------------
  cursor.register()
  core.viewport.canvas.tabIndex = 0
  core.inputs.keyboard.override('KeyF', 'up', () => framing.frameSelection.call())
  applyWebglBindings(core, framing, isolation, side)

  return {
    type: 'webgl',
    container: cmp,
    core,
    load: (source, loadSettings) => loader.load(source, loadSettings),
    open: (source, loadSettings) => loader.open(source, loadSettings),
    unload: vim => core.unload(vim),
    isolation,
    renderSettings,
    framing,
    isolationPanel: isolationPanelHandle,
    sectionBoxPanel: sectionBoxPanelHandle,
    sectionBox,
    contextMenu: contextMenuHandle,
    controlBar: bar,
    modal: modalHandle,
    bimInfo,
    ui,
    dispose: () => {
      for (const d of disposers) d()
      cursor.unregister()
      toast.destroy()
      axes.destroy()
      isolationPanelHandle.destroy()
      sectionBoxPanelHandle.destroy()
      bar.destroy()
      logoHandle.destroy()
      overlayHandle.destroy()
      rest.destroy()
      bimPage?.destroy()
      settingsPage.destroy()
      contextMenuHandle.destroy()
      sidePanelHandle.destroy()
      tips.destroy()
      performance.remove()
      modalHandle.destroy()
      fullScreen.destroy()
      pointer.destroy()
      isolation.destroy()
      renderSettings.destroy()
      state.destroy()
      framing.destroy()
      sectionBox.destroy()
      core.dispose()
      cmp.dispose()
    }
  }
}
