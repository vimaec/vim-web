import * as Icons from '../iconSet'
import type { MessageBoxProps, ModalApi } from '../modal'
import { isFalse, isTrue } from '../settings/userBoolean'
import type { SideState } from '../state/sideState'
import type { FullScreenState } from '../state/tools'
import type { UltraSettings } from '../ultra/settings'
import type { WebglSettings } from '../webgl/settings'
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

const settingsItem = (side: SideState, settings: WebglSettings | UltraSettings) => ({
  id: Ids.viewSettings,
  label: 'Settings',
  shortcut: 'F4',
  enabled: () => isTrue(settings.ui.miscSettings),
  isOn: () => side.getContent() === 'settings',
  action: () => side.toggleContent('settings')
})

export function webglTopBarContent (opts: {
  side: SideState
  modal: ModalApi
  fullScreen: FullScreenState
  settings: WebglSettings
}): TopBarContent {
  const { side, modal, fullScreen, settings } = opts
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
          settingsItem(side, settings)
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
  side: SideState
  modal: ModalApi
  settings: UltraSettings
}): TopBarContent {
  const { side, modal, settings } = opts
  return {
    menus: [
      { id: Ids.viewMenu, label: 'View', items: [settingsItem(side, settings)] },
      helpMenu(modal, settings)
    ],
    actions: []
  }
}

function showInspector (settings: WebglSettings) {
  if (isFalse(settings.ui.miscProjectInspector)) return false
  return isTrue(settings.ui.panelBimTree) || isTrue(settings.ui.panelBimInfo)
}
