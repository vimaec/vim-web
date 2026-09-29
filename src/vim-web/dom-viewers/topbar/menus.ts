import * as Icons from '../iconSet'
import type { MessageBoxProps, ModalApi } from '../modal'
import { isFalse, isTrue } from '../settings/userBoolean'
import type { SideState } from '../state/sideState'
import type { FullScreenState } from '../state/tools'
import type { UltraSettings } from '../ultra/settings'
import type { WebglSettings } from '../webgl/settings'
import type { ViewPanelApi } from '../viewpanel'
import { PARAMETERS_VIEW } from '../bim'
import { SETTINGS_VIEW } from '../settings'
import { topBarIds as Ids } from './topBarIds'
import type { TopBarContent } from './topBar'

/**
 * The top bar's built-in menus and actions — the twin of `controlbar/sections.ts`
 * for everything that is not a scene tool. Every predicate is re-read on
 * `bar.update()` and each time a menu opens.
 */

function about (): MessageBoxProps {
  const body = document.createElement('div')
  const line = document.createElement('p')
  line.textContent = 'A 3D viewer for VIM files, with BIM data.'
  const link = document.createElement('a')
  link.className = 'ds-link'
  link.href = 'https://vimaec.com'
  link.target = '_blank'
  link.rel = 'noreferrer'
  link.textContent = 'vimaec.com'
  body.append(line, link)
  return { title: 'VIM Web', body, canClose: true }
}

const helpMenu = (modal: ModalApi, settings: WebglSettings | UltraSettings) => ({
  id: Ids.helpMenu,
  label: 'Help',
  items: [
    {
      id: Ids.helpControls,
      label: 'Key navigation controls',
      enabled: () => isTrue(settings.ui.miscHelp),
      action: () => modal.help(true)
    },
    {
      id: Ids.helpAbout,
      label: 'About VIM Web',
      separatorBefore: true,
      action: () => modal.message(about())
    }
  ]
})

/** Opens the view, or closes it when its tab is already up. */
const toggleView = (views: ViewPanelApi, id: string) =>
  () => { if (views.isOpen(id)) views.close(id); else views.open(id) }

const settingsItem = (views: ViewPanelApi, settings: WebglSettings | UltraSettings) => ({
  id: Ids.viewSettings,
  label: 'Settings',
  shortcut: 'F4',
  enabled: () => isTrue(settings.ui.miscSettings),
  isOn: () => views.isOpen(SETTINGS_VIEW),
  action: toggleView(views, SETTINGS_VIEW)
})

export function webglTopBarContent (opts: {
  side: SideState
  modal: ModalApi
  fullScreen: FullScreenState
  settings: WebglSettings
  views: ViewPanelApi
}): TopBarContent {
  const { side, modal, fullScreen, settings, views } = opts
  return {
    menus: [
      {
        id: Ids.viewMenu,
        label: 'View',
        items: [
          {
            id: Ids.viewInspector,
            label: 'Project Inspector',
            enabled: () => showInspector(settings),
            isOn: () => side.getContent() === 'bim',
            action: () => side.toggleContent('bim')
          },
          {
            id: Ids.viewParameters,
            label: 'Parameters',
            enabled: () => isTrue(settings.ui.panelBimInfo),
            isOn: () => views.isOpen(PARAMETERS_VIEW),
            action: toggleView(views, PARAMETERS_VIEW)
          },
          settingsItem(views, settings)
        ]
      },
      helpMenu(modal, settings)
    ],
    actions: [
      {
        id: Ids.fullScreen,
        tip: () => fullScreen.get() ? 'Minimize' : 'Fullscreen',
        enabled: () => isTrue(settings.ui.miscMaximise) && settings.capacity.canGoFullScreen,
        icon: fullScreen.get() ? Icons.minimize : Icons.fullScreen,
        action: () => fullScreen.toggle()
      }
    ]
  }
}

export function ultraTopBarContent (opts: {
  modal: ModalApi
  settings: UltraSettings
  views: ViewPanelApi
}): TopBarContent {
  const { modal, settings, views } = opts
  return {
    menus: [
      { id: Ids.viewMenu, label: 'View', items: [settingsItem(views, settings)] },
      helpMenu(modal, settings)
    ],
    actions: []
  }
}

function showInspector (settings: WebglSettings) {
  if (isFalse(settings.ui.miscProjectInspector)) return false
  return isTrue(settings.ui.panelBimTree) || isTrue(settings.ui.panelBimInfo)
}
