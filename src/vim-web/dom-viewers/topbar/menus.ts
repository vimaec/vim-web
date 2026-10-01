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

/**
 * A host that denies `capacity.canFollowUrl` gets the address as text rather than a link: the page
 * still says where to find us, and nothing in the viewer can navigate away from it.
 */
function about (canFollowUrl: boolean): MessageBoxProps {
  const body = document.createElement('div')
  const line = document.createElement('p')
  line.textContent = 'A 3D viewer for VIM files, with BIM data.'
  const address = canFollowUrl ? document.createElement('a') : document.createElement('span')
  address.className = 'ds-link'
  address.textContent = 'vimaec.com'
  if (address instanceof HTMLAnchorElement) {
    address.href = 'https://vimaec.com'
    address.target = '_blank'
    address.rel = 'noreferrer'
  }
  body.append(line, address)
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
      action: () => modal.message(about(settings.capacity.canFollowUrl))
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
