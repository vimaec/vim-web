/**
 * @module viw-webgl-component
 */

import React, { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer/'
import { SideState } from './sidePanel/sideState'
import { Isolation } from './helpers/isolation'
import { Cursor, CursorManager, pointerToCursor } from './helpers/cursor'
import { ViewerWrapper } from './helpers/viewer'
import * as Icons from './icons'
import { HelpState } from './help'
import { Settings } from './settings/settings'

// Shared Buttons style

const toggleButton = (
  tip: string,
  action: () => void,
  icon: ({ height, width, fill }) => JSX.Element,
  isOn: () => boolean
) => {
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
  tip: string,
  action: () => void,
  icon: ({ height, width, fill }) => JSX.Element,
  state: boolean
) => {
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
  viewer: ViewerWrapper
  help: HelpState
  side: SideState
  isolation: Isolation
  cursor: CursorManager
  settings: Settings
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
    const subCam = props.viewer.viewer.camera.onMoved.subscribe(() => {
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
      <div className="vc-vim-control-bar-section vc-mx-2 vc-flex vc-items-center vc-rounded-full vc-bg-white vc-px-2 vc-shadow-md">
        <TabCamera {...props} />
      </div>
      <TabTools {...props} />
      <div className="vim-control-bar-section vc-mx-2 vc-flex vc-items-center vc-rounded-full vc-bg-white vc-px-2 vc-shadow-md">
        <TabSettings {...props} />
      </div>
    </div>
  )
}

function TabCamera (props: { viewer: ViewerWrapper }) {
  const viewer = props.viewer.viewer
  const helper = props.viewer
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
    'Orbit',
    () => onModeBtn('orbit'),
    Icons.orbit,
    () => mode === 'orbit'
  )
  const btnLook = toggleButton(
    'Look Around',
    () => onModeBtn('look'),
    Icons.look,
    () => mode === 'look'
  )
  const btnPan = toggleButton(
    'Pan',
    () => onModeBtn('pan'),
    Icons.pan,
    () => mode === 'pan'
  )
  const btnZoom = toggleButton(
    'Zoom',
    () => onModeBtn('zoom'),
    Icons.zoom,
    () => mode === 'zoom'
  )
  const btnFrameRect = toggleButton(
    'Zoom Window',
    () => {
      onModeBtn('rect')
      viewer.sectionBox.visible = false
      viewer.sectionBox.interactive = false
    },
    Icons.frameRect,
    () => mode === 'rect'
  )

  const btnFrame = actionButton(
    'Zoom to Fit',
    () => helper.frameContext(),
    Icons.frameSelection,
    false
  )

  return (
    <>
      {btnOrbit}
      {btnLook}
      {btnPan}
      {btnZoom}
      {btnFrameRect}
      {btnFrame}
    </>
  )
}

/* TAB TOOLS */
function TabTools (props: {
  viewer: ViewerWrapper
  cursor: CursorManager
  isolation: Isolation
}) {
  const viewer = props.viewer.viewer
  // Need a ref to get the up to date value in callback.
  const [measuring, setMeasuring] = useState(false)
  // eslint-disable-next-line no-unused-vars
  const [measurement, setMeasurement] = useState<VIM.THREE.Vector3>()
  const [section, setSection] = useState<{ clip: boolean; active: boolean }>({
    clip: viewer.sectionBox.clip,
    active: viewer.sectionBox.visible && viewer.sectionBox.interactive
  })

  const measuringRef = useRef<boolean>()
  measuringRef.current = measuring

  useEffect(() => {
    const subSection = viewer.sectionBox.onStateChanged.subscribe(() =>
      setSection({
        clip: viewer.sectionBox.clip,
        active: viewer.sectionBox.visible && viewer.sectionBox.interactive
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

    const next = !(viewer.sectionBox.visible && viewer.sectionBox.interactive)
    viewer.sectionBox.interactive = next
    viewer.sectionBox.visible = next
    if (
      next &&
      viewer.sectionBox.box.containsPoint(viewer.camera.camera.position)
    ) {
      viewer.camera.frame(
        viewer.renderer.section.box,
        'center',
        viewer.camera.defaultLerpDuration
      )
    }
  }

  const onMeasureBtn = () => {
    ReactTooltip.hide()

    if (measuring) {
      viewer.measure.abort()
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
    viewer.sectionBox.fitBox(viewer.renderer.getBoundingBox())
  }

  const onSectionClip = () => {
    viewer.sectionBox.clip = true
  }
  const onSectionNoClip = () => {
    viewer.sectionBox.clip = false
  }

  const onMeasureDeleteBtn = () => {
    ReactTooltip.hide()
    viewer.measure.abort()
    onMeasureBtn()
  }

  const btnSection = actionButton(
    'Sectioning Mode',
    onSectionBtn,
    Icons.sectionBox,
    false
  )

  const btnMeasure = actionButton(
    'Measuring Mode',
    onMeasureBtn,
    Icons.measure,
    false
  )

  const btnIsolation = actionButton(
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
    'Delete',
    onMeasureDeleteBtn,
    Icons.trash,
    !!measuring
  )
  const btnMeasureConfirm = actionButton(
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
    'Reset Section Box',
    onResetSectionBtn,
    Icons.sectionBoxReset,
    section.active
  )
  const btnSectionShrink = actionButton(
    'Shrink to Selection',
    () => viewer.sectionBox.fitBox(viewer.selection.getBoundingBox()),
    Icons.sectionBoxShrink,
    section.active
  )

  const btnSectionClip = actionButton(
    'Apply Section Box',
    onSectionClip,
    Icons.sectionBoxNoClip,
    section.active
  )
  const btnSectionNoClip = actionButton(
    'Ignore Section Box',
    onSectionNoClip,
    Icons.sectionBoxClip,
    section.active
  )
  const btnSectionConfirm = actionButton(
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
  settings: Settings
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
    'Project Inspector',
    onTreeViewBtn,
    Icons.treeView,
    () => props.side.getContent() === 'bim'
  )
  const btnSettings = toggleButton(
    'Settings',
    onSettingsBtn,
    Icons.settings,
    () => props.side.getContent() === 'settings'
  )
  const btnHelp = toggleButton(
    'Help',
    onHelpBtn,
    Icons.help,
    () => props.help.visible
  )

  const btnFullScreen = actionButton(
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
    <>
      {props.settings.ui.bimPanel ? btnTreeView : null}
      {btnSettings}
      {btnHelp}
      {props.settings.capacity.canGoFullScreen ? btnFullScreen : null}
    </>
  )
}

/**
 * Behaviour to have measure gizmo loop over and over.
 */
function loopMeasure (
  viewer: VIM.Viewer,
  getMeasuring: () => boolean,
  setMeasure: (value: VIM.THREE.Vector3) => void,
  setCursor: (cursor: Cursor) => void
) {
  const onMouseMove = () => {
    setMeasure(viewer.measure.measurement)
  }
  setCursor('cursor-measure')
  viewer.viewport.canvas.addEventListener('mousemove', onMouseMove)
  viewer.measure
    .start()
    .then(() => {
      setMeasure(viewer.measure.measurement)
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
        viewer.measure.clear()
      }
    })
}
