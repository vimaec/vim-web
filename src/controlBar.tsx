import React, { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer/'
import { SideState } from './sidePanel/sideState'
import { Isolation } from './helpers/isolation'
import { Cursor, CursorManager, pointerToCursor } from './helpers/cursor'
import { ViewerWrapper } from './helpers/viewer'
import * as Icons from './icons'
import { HelpState } from './help'

// Shared Buttons style

const toggleButton = (
  tip: string,
  action: () => void,
  icon: ({ height, width, fill }) => JSX.Element,
  isOn: () => boolean
) => {
  const style = isOn()
    ? 'rounded-full h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:text-primary-royal text-primary'
    : 'rounded-full h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:text-primary-royal text-gray-medium'
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
    ? 'rounded-full text-white h-10 w-10 flex items-center justify-center transition-all hover:scale-110 opacity-60 hover:opacity-100'
    : 'rounded-full text-gray-medium h-10 w-10 flex items-center justify-center transition-all hover:scale-110 hover:text-primary-royal'

  return (
    <button data-tip={tip} onClick={action} className={style} type="button">
      {icon({ height: '20', width: '20', fill: 'currentColor' })}
    </button>
  )
}

// Main Control bar
export function ControlBar (props: {
  viewer: ViewerWrapper
  help: HelpState
  side: SideState
  isolation: Isolation
  cursor: CursorManager
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
    props.viewer.base.camera.onMoved.subscribe(() => {
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
  }, [])

  return (
    <div
      className={`vim-control-bar flex items-center justify-center w-full fixed px-2 bottom-0 py-2 mb-9 transition-opacity transition-all ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="vim-control-bar-section flex items-center bg-white rounded-full px-2 shadow-md mx-2">
        <TabCamera {...props} />
      </div>
      <TabTools {...props} />
      <div className="vim-control-bar-section flex items-center bg-white rounded-full px-2 shadow-md mx-2">
        <TabSettings {...props} />
      </div>
    </div>
  )
}

function TabCamera (props: { viewer: ViewerWrapper }) {
  const viewer = props.viewer.base
  const helper = props.viewer
  const [mode, setMode] = useState<VIM.PointerMode>(viewer.inputs.pointerActive)

  useEffect(() => {
    viewer.inputs.onPointerModeChanged.subscribe(() => {
      setMode(viewer.inputs.pointerActive)
    })
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
      <div className="mx-1">{btnOrbit}</div>
      <div className="mx-1">{btnLook}</div>
      <div className="mx-1">{btnPan}</div>
      <div className="mx-1">{btnZoom}</div>
      <div className="mx-1">{btnFrameRect}</div>
      <div className="mx-1">{btnFrame}</div>
    </>
  )
}

/* TAB TOOLS */
function TabTools (props: {
  viewer: ViewerWrapper
  cursor: CursorManager
  isolation: Isolation
}) {
  const viewer = props.viewer.base
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
    viewer.sectionBox.onStateChanged.subscribe(() =>
      setSection({
        clip: viewer.sectionBox.clip,
        active: viewer.sectionBox.visible && viewer.sectionBox.interactive
      })
    )
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
    () => props.isolation.toggleContextual('controlBar'),
    Icons.toggleIsolation,
    false
  )

  const toolsTab = (
    <div className="vim-menu-section flex items-center bg-white rounded-full px-2 mx-2 shadow-md">
      <div className="mx-1">{btnSection}</div>
      <div className="mx-1">{btnMeasure}</div>
      <div className="mx-1">{btnIsolation}</div>
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
    <div className="vim-menu-section flex items-center bg-primary rounded-full px-2 mx-2 shadow-md">
      <div className="mx-1">{btnMeasureDelete}</div>
      <div className="mx-1 py-1 bg-white/[.5] h-5 w-px"></div>
      <div className="mx-1">{btnMeasureConfirm}</div>
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
    <div className="vim-menu-section flex items-center bg-primary rounded-full px-2 mx-2 shadow-md">
      <div className="mx-1">{btnSectionReset}</div>
      <div className="mx-1">{btnSectionShrink}</div>
      <div className="mx-1">
        {section.clip ? btnSectionNoClip : btnSectionClip}
      </div>
      <div className="mx-1 py-1 bg-white/[.5] h-5 w-px"></div>
      <div className="mx-1">{btnSectionConfirm}</div>
    </div>
  )

  // There is a weird bug with tooltips not working properly
  // if measureTab or sectionTab do not have the same number of buttons as toolstab

  return measuring ? measureTab : section.active ? sectionTab : toolsTab
}

function TabSettings (props: { help: HelpState; side: SideState }) {
  const [fullScreen, setFullScreen] = useState<boolean>(
    !!document.fullscreenElement
  )
  const fullScreenRef = useRef<boolean>(fullScreen)

  useEffect(() => {
    // F11 doesn't properly register fullscreen changes so we resorot to polling
    const refreshFullScreen = () => {
      setTimeout(refreshFullScreen, 250)
      const next = !!document.fullscreenElement
      if (fullScreenRef.current !== next) {
        fullScreenRef.current = next
        setFullScreen(next)
      }
    }
    refreshFullScreen()
  }, [])

  const onHelpBtn = () => {
    props.help.setVisible(!props.help.visible)
  }

  const onTreeViewBtn = () => {
    props.side.toggle('bim')
  }

  const onSettingsBtn = () => {
    props.side.toggle('settings')
  }

  const btnTreeView = toggleButton(
    'Project Inspector',
    onTreeViewBtn,
    Icons.treeView,
    () => props.side.get() === 'bim'
  )
  const btnSettings = toggleButton(
    'Settings',
    onSettingsBtn,
    Icons.settings,
    () => props.side.get() === 'settings'
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
      <div className="mx-1">{btnTreeView}</div>
      <div className="mx-1">{btnSettings}</div>
      <div className="mx-1">{btnHelp}</div>
      <div className="mx-1">{btnFullScreen}</div>
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
