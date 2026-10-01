import * as Core from '../../core-viewers'

import { type Container, createContainer } from '../container'
import { createSettings } from '../settings/settingsState'
import { disableLocalStorage } from '../settings/localStorage'
import { getDefaultUltraSettings, type PartialUltraSettings, type UltraSettings } from './settings'
import { getUltraSettingsContent } from './settingsContent'

import { tooltipZone } from '../components'
import { controlBar } from '../controlbar/controlBar'
import { ultraControlBarSections } from '../controlbar/sections'
import { getRequestErrorMessage } from '../errors'
import { modal } from '../modal/modal'
import type { ModalApi } from '../modal'
import { logo } from '../panels/logo'
import { overlay } from '../panels/overlay'
import { restOfScreen } from '../panels/restOfScreen'
import { sidePanel } from '../panels/sidePanel'
import { settingsView, SETTINGS_VIEW } from '../settings/settingsView'
import { viewPanel } from '../viewpanel/viewPanel'
import { modelName, topBar } from '../topbar/topBar'
import { ultraTopBarContent } from '../topbar/menus'
import { createSideState } from '../state/sideState'
import { createUiRefs, liveUiSettings, ultraUiApi } from '../state/uiState'
import { createUltraFraming } from '../state/framing'
import { createUltraIsolation } from '../state/isolation'
import { createUltraSectionBox } from '../state/sectionBox'
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

  on(core.onStateChanged, state => updateModal(modalHandle, state))

  // ---- DOM -------------------------------------------------------------------
  const tips = tooltipZone(cmp.ui)
  const sidePanelHandle = sidePanel(cmp.ui, {
    side,
    root: cmp.root,
    gfx: cmp.gfx,
    resize: () => core.viewport.resizeToParent()
  })

  // The tabbed dock on the right. Views register here and are built on first open.
  const views = viewPanel(cmp.ui, {
    root: cmp.root,
    gfx: cmp.gfx,
    resize: () => core.viewport.resizeToParent()
  })
  views.register(SETTINGS_VIEW, () => settingsView({ entries: () => getUltraSettingsContent(isolation) }))

  // The application bar. It owns the top strip above the side panel and the viewport, so it also
  // offsets the canvas container and re-measures the viewport.
  const topBarHandle = topBar(cmp.ui, {
    content: ultraTopBarContent({ modal: modalHandle, settings: live, views }),
    gfx: cmp.gfx,
    resize: () => core.viewport.resizeToParent()
  })

  const rest = restOfScreen(cmp.ui, side)
  on(side.onChange, () => rest.update())
  // The brand lives in the bar; the floating logo is the fallback when the bar is off.
  const logoHandle = logo(rest.el, { canFollowUrl: fullSettings.capacity.canFollowUrl })
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
    topBarHandle.update(ultraTopBarContent({ modal: modalHandle, settings: live, views }))
  }
  for (const event of [
    side.onChange,
    isolation.visibility.onChange, isolation.autoIsolate.onChange,
    sectionBox.active.onChange, sectionBox.visible.onChange, sectionBox.auto.onChange,
    framing.autoCamera.onChange, core.selection.onSelectionChanged, core.renderer.onSceneUpdated,
    ...Object.values(refs).map(r => r.onChange)
  ] as { subscribe (fn: (...args: unknown[]) => void): () => void }[]) disposers.push(event.subscribe(refreshBar))


  const ultraLoad = patchLoad(core, modalHandle)

  return {
    type: 'ultra',
    container: cmp,
    core,
    modal: modalHandle,
    isolation,
    sectionBox,
    framing,
    ui,
    controlBar: bar,
    topBar: topBarHandle,
    views,
    load: source => {
      topBarHandle.setTitle(modelName(source.url))
      return ultraLoad(source)
    },
    unload: vim => core.unload(vim),
    dispose: () => {
      for (const d of disposers) d()
      bar.destroy()
      topBarHandle.destroy()
      views.destroy()
      overlayHandle.destroy()
      logoHandle.destroy()
      rest.destroy()
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
