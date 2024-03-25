/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer/'
import { SideState } from '../sidePanel/sideState'
import { Isolation } from '../helpers/isolation'
import { Cursor, CursorManager, pointerToCursor } from '../helpers/cursor'
import { ComponentCamera } from '../helpers/camera'
import * as Icons from './icons'
import { HelpState } from './help'
import {
  ComponentSettings,
  anyUiCursorButton,
  anyUiSettingButton,
  anyUiToolButton,
  isTrue
} from '../settings/settings'

// Shared Buttons style

const toggleButton = (
  enabled: () => boolean,
  tip: string,
  action: () => void,
  icon: ({ height, width, fill }) => JSX.Element,
  isOn: () => boolean
) => {
  if (!enabled()) return null
  const style = isOn()
    ? 'vim-control-bar-button vc-rounded-full vc-mx-1 vc-h-10 vc-w-10 vc-flex vc-items-center vc-justify-center vc-transition-all hover:vc-scale-110 hover:vc-text-primary-royal vc-text-primary'
    : 'vim-control-bar-button vc-rounded-full vc-mx-1 vc-h-10 vc-w-10 vc-flex vc-items-center vc-justify-center vc-transition-all hover:vc-scale-110 hover:vc-text-primary-royal vc-text-gray-medium'
  return (
    <button data-tip={tip} onClick={action} className={style} type="button">
      {icon({ height: '20', width: '20', fill: 'currentColor' })}
    </button>
  )
}

const actionButton = (
  enabled: () => boolean,
  tip: string,
  action: () => void,
  icon: ({ height, width, fill }) => JSX.Element,
  state: boolean
) => {
  if (!enabled()) return null
  const style = state
    ? 'vim-control-bar-button vc-rounded-full vc-mx-1 vc-text-white vc-h-10 vc-w-10 vc-flex vc-items-center vc-justify-center vc-transition-all hover:vc-scale-110 vc-opacity-60 hover:vc-opacity-100'
    : 'vim-control-bar-button vc-rounded-full vc-mx-1 vc-text-gray-medium vc-h-10 vc-w-10 vc-flex vc-items-center vc-justify-center vc-transition-all hover:vc-scale-110 hover:vc-text-primary-royal'

  return (
    <button data-tip={tip} onClick={action} className={style} type="button">
      {icon({ height: '20', width: '20', fill: 'currentColor' })}
    </button>
  )
}

/**
 * JSX Component for the control bar.
 */
export function ControlBar (props: {
  viewer: VIM.Viewer
  camera: ComponentCamera
  help: HelpState
  side: SideState
  isolation: Isolation
  cursor: CursorManager
  settings: ComponentSettings
}) {
  const [show, setShow] = useState(true)
  const showRef = useRef(show)
  const barTimeout = useRef<ReturnType<typeof setTimeout>>()

  // On Each Render
  useEffect(() => {
    ReactTooltip.rebuild()
  })

  // On First Render
  useEffect(() => {
    // Hide bar for a couple ms
    const subCam = props.viewer.camera.onMoved.subscribe(() => {
      if (showRef.current) {
        showRef.current = false
        setShow(false)
      }

      clearTimeout(barTimeout.current)
      barTimeout.current = setTimeout(() => {
        if (!showRef.current) {
          showRef.current = true
          setShow(true)
        }
      }, 200)
    })

    // Clean up
    return () => {
      subCam()
      clearTimeout(barTimeout.current)
    }
  }, [])

  return (
    <div
      style={{ paddingLeft: props.side.getWidth() }}
      className={`vim-control-bar vc-fixed vc-bottom-0 vc-z-20 vc-mb-9 vc-flex vc-w-full vc-items-center vc-justify-center vc-px-2 vc-py-2 vc-transition-opacity vc-transition-all ${
        show ? 'vc-opacity-100' : 'vc-pointer-events-none vc-opacity-0'
      }`}
    >
      {anyUiCursorButton(props.settings) ? <TabCamera {...props} /> : null}
      {anyUiToolButton(props.settings) ? <TabTools {...props} /> : null}
      {anyUiSettingButton(props.settings) ? <TabSettings {...props} /> : null}
    </div>
  )
}

function TabCamera (props: {viewer: VIM.Viewer, camera: ComponentCamera; settings: ComponentSettings }) {
  const viewer = props.viewer
  const [mode, setMode] = useState<VIM.PointerMode>(viewer.inputs.pointerActive)

  useEffect(() => {
    const subPointer = viewer.inputs.onPointerModeChanged.subscribe(() => {
      setMode(viewer.inputs.pointerActive)
    })

    // Clean up
    return () => {
      subPointer()
    }
  }, [])

  const onModeBtn = (target: VIM.PointerMode) => {
    const next = mode === target ? viewer.inputs.pointerFallback : target
    viewer.inputs.pointerActive = next
    setMode(next)
  }

  // Camera
  const btnOrbit = toggleButton(
    () => isTrue(props.settings.ui.orbit),
    'Orbit',
    () => onModeBtn('orbit'),
    Icons.orbit,
    () => mode === 'orbit'
  )
  const btnLook = toggleButton(
    () => isTrue(props.settings.ui.lookAround),
    'Look Around',
    () => onModeBtn('look'),
    Icons.look,
    () => mode === 'look'
  )
  const btnPan = toggleButton(
    () => isTrue(props.settings.ui.pan),
    'Pan',
    () => onModeBtn('pan'),
    Icons.pan,
    () => mode === 'pan'
  )
  const btnZoom = toggleButton(
    () => isTrue(props.settings.ui.zoom),
    'Zoom',
    () => onModeBtn('zoom'),
    Icons.zoom,
    () => mode === 'zoom'
  )
  const btnFrameRect = toggleButton(
    () => isTrue(props.settings.ui.zoomWindow),
    'Zoom Window',
    () => {
      onModeBtn('rect')
      viewer.gizmos.section.visible = false
      viewer.gizmos.section.interactive = false
    },
    Icons.frameRect,
    () => mode === 'rect'
  )
  const btnFrame = actionButton(
    () => isTrue(props.settings.ui.zoomToFit),
    'Zoom to Fit',
    () => props.camera.frameContext(),
    Icons.frameSelection,
    false
  )

  return (
    <div className="vc-vim-control-bar-section vc-mx-2 vc-flex vc-items-center vc-rounded-full vc-bg-white vc-px-2 vc-shadow-md">
      {btnOrbit}
      {btnLook}
      {btnPan}
      {btnZoom}
      {btnFrameRect}
      {btnFrame}
    </div>
  )
}

/* TAB TOOLS */
function TabTools (props: {
  viewer: VIM.Viewer
  cursor: CursorManager
  isolation: Isolation
  settings: ComponentSettings
}) {
  const viewer = props.viewer
  // Need a ref to get the up to date value in callback.
  const [measuring, setMeasuring] = useState(false)
  const firstSection = useRef(true)
  // eslint-disable-next-line no-unused-vars
  const [measurement, setMeasurement] = useState<THREE.Vector3>()
  const [section, setSection] = useState<{ clip: boolean; active: boolean }>({
    clip: viewer.gizmos.section.clip,
    active: viewer.gizmos.section.visible && viewer.gizmos.section.interactive
  })

  const measuringRef = useRef<boolean>()
  measuringRef.current = measuring

  useEffect(() => {
    const subSection = viewer.gizmos.section.onStateChanged.subscribe(() =>
      setSection({
        clip: viewer.gizmos.section.clip,
        active:
          viewer.gizmos.section.visible && viewer.gizmos.section.interactive
      })
    )

    // Clean up
    return () => {
      subSection()
    }
  }, [])

  const onSectionBtn = () => {

    ReactTooltip.hide()
    if (viewer.inputs.pointerActive === 'rect') {
      viewer.inputs.pointerActive = viewer.inputs.pointerFallback
    }

    const next = !(
      viewer.gizmos.section.visible && viewer.gizmos.section.interactive
    )

    if (next){
      if(firstSection.current){
        viewer.gizmos.section.clip = true
        viewer.gizmos.section.fitBox(viewer.renderer.getBoundingBox().expandByScalar(1))
      }
      if(viewer.gizmos.section.box.containsPoint(viewer.camera.position)){
        viewer.camera.lerp(1).frame(viewer.renderer.section.box)
      }
    }

    viewer.gizmos.section.interactive = next
    viewer.gizmos.section.visible = next
    firstSection.current = false
  }

  const onMeasureBtn = () => {
    ReactTooltip.hide()

    if (measuring) {
      viewer.gizmos.measure.abort()
      setMeasuring(false)
    } else {
      setMeasuring(true)
      loopMeasure(
        viewer,
        () => measuringRef.current,
        (m) => setMeasurement(m),
        props.cursor.setCursor
      )
    }
  }

  const onResetSectionBtn = () => {
    viewer.gizmos.section.fitBox(viewer.renderer.getBoundingBox())
  }

  const onSectionClip = () => {
    viewer.gizmos.section.clip = true
  }
  const onSectionNoClip = () => {
    viewer.gizmos.section.clip = false
  }

  const onMeasureDeleteBtn = () => {
    ReactTooltip.hide()
    viewer.gizmos.measure.abort()
    onMeasureBtn()
  }

  const btnSection = actionButton(
    () => isTrue(props.settings.ui.sectioningMode),
    'Sectioning Mode',
    onSectionBtn,
    Icons.sectionBox,
    false
  )

  const btnMeasure = actionButton(
    () => isTrue(props.settings.ui.measuringMode),
    'Measuring Mode',
    onMeasureBtn,
    Icons.measure,
    false
  )

  const btnIsolation = actionButton(
    () => isTrue(props.settings.ui.toggleIsolation),
    'Toggle Isolation',
    () => {
      props.isolation.toggleIsolation('controlBar')
    },
    Icons.toggleIsolation,
    false
  )

  const toolsTab = (
    <div className="vim-control-bar-section vc-mx-2 vc-flex vc-items-center vc-rounded-full vc-bg-white vc-px-2 vc-shadow-md">
      {btnSection}
      {btnMeasure}
      {btnIsolation}
    </div>
  )

  const btnMeasureDelete = actionButton(
    () => true,
    'Delete',
    onMeasureDeleteBtn,
    Icons.trash,
    !!measuring
  )
  const btnMeasureConfirm = actionButton(
    () => true,
    'Done',
    onMeasureBtn,
    Icons.checkmark,
    !!measuring
  )
  const measureTab = (
    <div className="vim-control-bar-section vc-mx-2 vc-flex vc-items-center vc-rounded-full vc-bg-primary vc-px-2 vc-shadow-md">
      <div className="vc-mx-1">{btnMeasureDelete}</div>
      <div className="vc-mx-1 vc-h-5 vc-w-px vc-bg-white/[.5] vc-py-1"></div>
      <div className="vc-mx-1">{btnMeasureConfirm}</div>
    </div>
  )

  const btnSectionReset = actionButton(
    () => true,
    'Reset Section Box',
    onResetSectionBtn,
    Icons.sectionBoxReset,
    section.active
  )
  const btnSectionShrink = actionButton(
    () => true,
    'Shrink to Selection',
    () => viewer.gizmos.section.fitBox(viewer.selection.getBoundingBox()),
    Icons.sectionBoxShrink,
    section.active
  )

  const btnSectionClip = actionButton(
    () => true,
    'Apply Section Box',
    onSectionClip,
    Icons.sectionBoxNoClip,
    section.active
  )
  const btnSectionNoClip = actionButton(
    () => true,
    'Ignore Section Box',
    onSectionNoClip,
    Icons.sectionBoxClip,
    section.active
  )
  const btnSectionConfirm = actionButton(
    () => true,
    'Done',
    onSectionBtn,
    Icons.checkmark,
    section.active
  )
  const sectionTab = (
    <div className="vim-control-bar-section vc-mx-2 vc-flex vc-items-center vc-rounded-full vc-bg-primary vc-px-2 vc-shadow-md">
      {btnSectionReset}
      {btnSectionShrink}
      {section.clip ? btnSectionNoClip : btnSectionClip}
      <div className="vc-mx-1 vc-h-5 vc-w-px vc-bg-white/[.5] vc-py-1"></div>
      {btnSectionConfirm}
    </div>
  )

  // There is a weird bug with tooltips not working properly
  // if measureTab or sectionTab do not have the same number of buttons as toolstab

  return measuring ? measureTab : section.active ? sectionTab : toolsTab
}

function TabSettings (props: {
  help: HelpState
  side: SideState
  settings: ComponentSettings
}) {
  const [fullScreen, setFullScreen] = useState<boolean>(
    !!document.fullscreenElement
  )
  const fullScreenRef = useRef<boolean>(fullScreen)

  useEffect(() => {
    // F11 doesn't properly register fullscreen changes so we resorot to polling
    let time: ReturnType<typeof setTimeout>
    const refreshFullScreen = () => {
      time = setTimeout(refreshFullScreen, 250)
      const next = !!document.fullscreenElement
      if (fullScreenRef.current !== next) {
        fullScreenRef.current = next
        setFullScreen(next)
      }
    }
    refreshFullScreen()

    return () => {
      clearTimeout(time)
    }
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

  const btnTreeView = toggleButton(
    () => isTrue(props.settings.ui.projectInspector),
    'Project Inspector',
    onTreeViewBtn,
    Icons.treeView,
    () => props.side.getContent() === 'bim'
  )
  const btnSettings = toggleButton(
    () => isTrue(props.settings.ui.settings),
    'Settings',
    onSettingsBtn,
    Icons.settings,
    () => props.side.getContent() === 'settings'
  )

  const btnHelp = toggleButton(
    () => isTrue(props.settings.ui.help),
    'Help',
    onHelpBtn,
    Icons.help,
    () => props.help.visible
  )

  const btnFullScreen = actionButton(
    () =>
      isTrue(props.settings.ui.maximise) &&
      props.settings.capacity.canGoFullScreen,
    document.fullscreenElement ? 'Fullscreen' : 'Minimize',
    () => {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        document.body.requestFullscreen()
      }
    },
    document.fullscreenElement ? Icons.minimize : Icons.fullsScreen,
    false
  )

  return (
    <div className="vim-control-bar-section vc-mx-2 vc-flex vc-items-center vc-rounded-full vc-bg-white vc-px-2 vc-shadow-md">
      {isTrue(props.settings.ui.bimTreePanel) ||
      isTrue(props.settings.ui.bimInfoPanel)
        ? btnTreeView
        : null}
      {btnSettings}
      {btnHelp}
      {btnFullScreen}
    </div>
  )
}

/**
 * Behaviour to have measure gizmo loop over and over.
 */
function loopMeasure (
  viewer: VIM.Viewer,
  getMeasuring: () => boolean,
  setMeasure: (value: THREE.Vector3) => void,
  setCursor: (cursor: Cursor) => void
) {
  const onMouseMove = () => {
    setMeasure(viewer.gizmos.measure.measurement)
  }
  setCursor('cursor-measure')
  viewer.viewport.canvas.addEventListener('mousemove', onMouseMove)
  viewer.gizmos.measure
    .start()
    .then(() => {
      setMeasure(viewer.gizmos.measure.measurement)
    })
    .catch(() => {
      setMeasure(undefined)
    })
    .finally(() => {
      setCursor(pointerToCursor(viewer.inputs.pointerActive))
      viewer.viewport.canvas.removeEventListener('mousemove', onMouseMove)
      if (getMeasuring()) {
        loopMeasure(viewer, getMeasuring, setMeasure, setCursor)
      } else {
        viewer.gizmos.measure.clear()
      }
    })
}
