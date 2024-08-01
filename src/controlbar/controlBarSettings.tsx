/**
 * @module viw-webgl-component
 */

import { useEffect, useRef, useState } from 'react'
import { SideState } from '../sidePanel/sideState'
import * as Icons from '../panels/icons'
import { HelpState } from '../panels/help'
import {
  ComponentSettings, isTrue
} from '../settings/settings'
import { createButton, IControlBarButtonItem, stdStyle } from './controlBarButton'
import { createSection } from './controlBarSection'
import { FullScreenObserver } from '../helpers/fullScreenObserver'

export function TabSettings (props: {
  help: HelpState
  side: SideState
  settings: ComponentSettings
}) {
  const fullScreenRef = useRef(new FullScreenObserver())
  const [fullScreen, setFullScreen] = useState<boolean>(
    fullScreenRef.current.isFullScreen()
  )

  useEffect(() => {
    fullScreenRef.current.onFullScreenChange = (value) => setFullScreen(value)
    return () => fullScreenRef.current.dispose()
  }, [])

  const onHelpBtn = () => {
    props.help.setVisible(!props.help.visible)
  }

  const onTreeViewBtn = () => {
    props.side.toggleContent('bim')
  }

  const onSettingsBtn = () => {
    props.side.toggleContent('settings')
  }

  const buttons : IControlBarButtonItem[] = [
    {
      enabled: () => isTrue(props.settings.ui.projectInspector) && (
        isTrue(props.settings.ui.bimTreePanel) ||
        isTrue(props.settings.ui.bimInfoPanel)),
      tip: 'Project Inspector',
      action: onTreeViewBtn,
      icon: Icons.treeView,
      style: stdStyle
    },
    {
      enabled: () => isTrue(props.settings.ui.settings),
      tip: 'Settings',
      action: onSettingsBtn,
      icon: Icons.settings,
      style: stdStyle
    },
    {
      enabled: () => isTrue(props.settings.ui.help),
      tip: 'Help',
      action: onHelpBtn,
      icon: Icons.help,
      style: stdStyle
    },
    {
      enabled: () =>
        isTrue(props.settings.ui.maximise) &&
        props.settings.capacity.canGoFullScreen,
      tip: fullScreen ? 'Minimize' : 'Fullscreen',
      action: () => {
        if (fullScreen) {
          document.exitFullscreen()
        } else {
          document.body.requestFullscreen()
        }
      },
      icon: fullScreen ? Icons.minimize : Icons.fullsScreen,
      style: stdStyle
    }
  ]

  return createSection('white', buttons.map(b => createButton(b)))
}
