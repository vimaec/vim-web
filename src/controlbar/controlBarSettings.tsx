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
import { createButton } from './controlBarButton'
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

  const btnTreeView = createButton(
    () => isTrue(props.settings.ui.projectInspector),
    'Project Inspector',
    onTreeViewBtn,
    Icons.treeView,
    () => props.side.getContent() === 'bim'
  )
  const btnSettings = createButton(
    () => isTrue(props.settings.ui.settings),
    'Settings',
    onSettingsBtn,
    Icons.settings,
    () => props.side.getContent() === 'settings'
  )

  const btnHelp = createButton(
    () => isTrue(props.settings.ui.help),
    'Help',
    onHelpBtn,
    Icons.help,
    () => props.help.visible
  )

  const btnFullScreen = createButton(
    () =>
      isTrue(props.settings.ui.maximise) &&
      props.settings.capacity.canGoFullScreen,
    fullScreen ? 'Fullscreen' : 'Minimize',
    () => {
      if (fullScreen) {
        document.exitFullscreen()
      } else {
        document.body.requestFullscreen()
      }
    },
    fullScreen ? Icons.minimize : Icons.fullsScreen
  )

  const tree = isTrue(props.settings.ui.bimTreePanel) ||
      isTrue(props.settings.ui.bimInfoPanel)
    ? btnTreeView
    : null

  return createSection('white', [tree, btnSettings, btnHelp, btnFullScreen])
}
