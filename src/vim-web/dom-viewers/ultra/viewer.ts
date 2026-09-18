import * as Core from '../../core-viewers'

import { type Container, createContainer } from '../container'
import { createSettings } from '../settings/settingsState'
import { disableLocalStorage } from '../settings/localStorage'
import { getDefaultUltraSettings, type PartialUltraSettings, type UltraSettings } from './settings'
import { getUltraSettingsContent } from './settingsContent'

import { tooltipZone } from '../components'
import { controlBar } from '../controlbar'
import { ultraControlBarSections } from '../controlbar/sections'
import { getRequestErrorMessage } from '../errors'
import { genericPanel } from '../generic'
import { modal, type ModalApi } from '../modal'
import { logo, overlay, restOfScreen, sectionBoxPanel, sidePanel } from '../panels'
import { settingsPanel } from '../settings'
import { modelName, topBar, ultraTopBarContent } from '../topbar'
import {
  createSideState,
  createUiRefs,
  createUltraFraming,
  createUltraIsolation,
  createUltraSectionBox,
  liveUiSettings,
  ultraUiApi
} from '../state'
import { updateModal, updateProgress } from './modal'
import type { UltraViewerApi } from './viewerApi'

/**
 * Creates an Ultra viewer with the DS UI for server-side rendered models. The
 * twin of the React `createUltraViewer`.
 *
 * @param container An optional container or DOM element; one is created otherwise.
 * @param settings UI feature toggles (panels, buttons). See {@link UltraSettings}.
 */
export async function createDomUltraViewer (
  container?: Container | HTMLElement,
  settings?: PartialUltraSettings
): Promise<UltraViewerApi> {
  const cmp = container instanceof HTMLElement
    ? createContainer(container)
    : container ?? createContainer()
  cmp.ui.classList.add('ds-root', 'vim-ds-ui')

  const core = Core.Ultra.createViewer(cmp.gfx)
  const fullSettings = createSettings(settings ?? {}, getDefaultUltraSettings())
  if (!fullSettings.capacity.canReadLocalStorage) disableLocalStorage()

  const refs = createUiRefs(fullSettings.ui)
  const ui = ultraUiApi(refs)
  const live: UltraSettings = { ...fullSettings, ui: liveUiSettings(refs, fullSettings.ui) }

  const disposers: (() => void)[] = []
  const on = <T>(event: { subscribe (fn: (v: T) => void): () => void }, fn: (v: T) => void) => {
    disposers.push(event.subscribe(fn))
  }

  // ---- state -----------------------------------------------------------------
  const modalHandle = modal()
  const sectionBox = createUltraSectionBox(core, fullSettings.sectionBox)
  const framing = createUltraFraming(core, sectionBox, fullSettings.camera.autoCamera)
  const side = createSideState(true, 400)
  const isolation = createUltraIsolation(core, fullSettings.isolation)

  core.inputs.keyboard.override('KeyF', 'up', () => framing.frameSelection.call())
  if (fullSettings.cursor?.default !== undefined) core.inputs.pointerMode = fullSettings.cursor.default

  on(sectionBox.showOffsetPanel.onChange, show => { if (show) isolation.showPanel.set(false) })
  on(isolation.showPanel.onChange, show => { if (show) sectionBox.showOffsetPanel.set(false) })
  on(core.onStateChanged, state => updateModal(modalHandle, state))

  // ---- DOM -------------------------------------------------------------------
  const tips = tooltipZone(cmp.ui)
  const sidePanelHandle = sidePanel(cmp.ui, {
    side,
    root: cmp.root,
    gfx: cmp.gfx,
    resize: () => core.viewport.resizeToParent()
  })
  const settingsPage = settingsPanel(sidePanelHandle.body, {
    entries: getUltraSettingsContent(isolation),
    onClose: () => side.popContent()
  })
  const syncPages = () => settingsPage.setVisible(side.getContent() === 'settings')
  syncPages()
  on(side.onChange, syncPages)

  // The application bar. It owns the top strip above the side panel and the viewport, so it also
  // offsets the canvas container and re-measures the viewport.
  const topBarHandle = topBar(cmp.ui, {
    content: ultraTopBarContent({ side, modal: modalHandle, settings: live }),
    gfx: cmp.gfx,
    resize: () => core.viewport.resizeToParent()
  })

  const rest = restOfScreen(cmp.ui, side)
  on(side.onChange, () => rest.update())
  // The brand lives in the bar; the floating logo is the fallback when the bar is off.
  const logoHandle = logo(rest.el)
  const syncBranding = () => {
    const showLogo = refs.panelLogo.get()
    const showBar = refs.panelTopBar.get()
    topBarHandle.setVisible(showBar)
    topBarHandle.setBrandVisible(showLogo)
    logoHandle.el.hidden = !showLogo || showBar
  }
  syncBranding()
  on(refs.panelLogo.onChange, syncBranding)
  on(refs.panelTopBar.onChange, syncBranding)
  const overlayHandle = overlay(rest.el, core.viewport.canvas)

  const sections = () => ultraControlBarSections({
    viewer: core, framing, settings: live, sectionBox, isolation
  })
  const bar = controlBar(rest.el, sections())
  const syncBar = () => bar.setVisible(refs.panelControlBar.get())
  syncBar()
  on(refs.panelControlBar.onChange, syncBar)
  const refreshBar = () => {
    bar.update(sections())
    topBarHandle.update(ultraTopBarContent({ side, modal: modalHandle, settings: live }))
  }
  for (const event of [
    side.onChange,
    isolation.visibility.onChange, isolation.autoIsolate.onChange, isolation.showPanel.onChange,
    sectionBox.active.onChange, sectionBox.visible.onChange, sectionBox.auto.onChange, sectionBox.showOffsetPanel.onChange,
    framing.autoCamera.onChange, core.selection.onSelectionChanged, core.renderer.onSceneUpdated,
    ...Object.values(refs).map(r => r.onChange)
  ] as { subscribe (fn: (...args: unknown[]) => void): () => void }[]) disposers.push(event.subscribe(refreshBar))

  const sectionBoxPanelHandle = sectionBoxPanel(rest.el, { sectionBox, anchor: () => bar.el })
  // Ultra-specific isolation panel — only ghost controls (the server handles rendering).
  const isolationPanelHandle = genericPanel(rest.el, {
    title: 'Render Settings',
    show: isolation.showPanel,
    anchor: () => bar.el,
    entries: [
      { type: 'bool', id: 'isolationPanel.showGhost', label: 'Show Ghost', state: isolation.showGhost },
      {
        type: 'number',
        id: 'isolationPanel.ghostOpacity',
        label: 'Ghost Opacity',
        state: isolation.ghostOpacity,
        enabled: () => isolation.showGhost.get(),
        min: 0,
        max: 1,
        step: 1 / 255,
        transform: n => Math.max(0, Math.min(1, n))
      }
    ]
  })

  const ultraLoad = patchLoad(core, modalHandle)

  return {
    type: 'ultra',
    container: cmp,
    core,
    modal: modalHandle,
    isolation,
    sectionBox,
    framing,
    isolationPanel: isolationPanelHandle,
    sectionBoxPanel: sectionBoxPanelHandle,
    ui,
    controlBar: bar,
    topBar: topBarHandle,
    load: source => {
      topBarHandle.setTitle(modelName(source.url))
      return ultraLoad(source)
    },
    unload: vim => core.unload(vim),
    dispose: () => {
      for (const d of disposers) d()
      isolationPanelHandle.destroy()
      sectionBoxPanelHandle.destroy()
      bar.destroy()
      topBarHandle.destroy()
      overlayHandle.destroy()
      logoHandle.destroy()
      rest.destroy()
      settingsPage.destroy()
      sidePanelHandle.destroy()
      tips.destroy()
      modalHandle.destroy()
      isolation.destroy()
      framing.destroy()
      sectionBox.destroy()
      core.dispose()
      cmp.dispose()
    }
  }
}

/** Decorates `core.load` with progress and error reporting on the modal. */
function patchLoad (viewer: Core.Ultra.Viewer, modal: ModalApi) {
  return function load (source: Core.Ultra.VimSource): Core.Ultra.IUltraLoadRequest {
    const request = viewer.load(source)
    // Progress is streamed without blocking the caller.
    void updateProgress(request, modal)
    void request.getResult().then(result => {
      if (result.isError) {
        modal.message(getRequestErrorMessage(viewer.serverUrl, source, result.type))
        return
      }
      if (result.isSuccess) modal.loading(undefined)
    })
    return request
  }
}
