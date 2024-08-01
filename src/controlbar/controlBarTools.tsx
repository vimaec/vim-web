/**
 * @module viw-webgl-component
 */

import { useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import * as VIM from 'vim-webgl-viewer/'
import { Isolation } from '../helpers/isolation'
import { CursorManager } from '../helpers/cursor'
import * as Icons from '../panels/icons'
import {
  ComponentSettings, isTrue
} from '../settings/settings'
import { loopMeasure } from '../helpers/measureLoop'
import { createButton, stdStyle, blueStyle, IControlBarButtonItem } from './controlBarButton'
import { createSection } from './controlBarSection'

/* TAB TOOLS */
export function TabTools (props: {
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
  const [measurement, setMeasurement] = useState<VIM.THREE.Vector3>()
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
    toggleSectionBox(viewer, firstSection.current)
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

  const toolButtons : IControlBarButtonItem[] = [
    {
      enabled: () => isTrue(props.settings.ui.sectioningMode),
      tip: 'Sectioning Mode',
      action: onSectionBtn,
      icon: Icons.sectionBox,
      style: stdStyle
    },
    {
      enabled: () => isTrue(props.settings.ui.measuringMode),
      tip: 'Measuring Mode',
      action: onMeasureBtn,
      icon: Icons.measure,
      style: stdStyle
    },
    {
      enabled: () => isTrue(props.settings.ui.toggleIsolation),
      tip: 'Toggle Isolation',
      action: () => props.isolation.toggleIsolation('controlBar'),
      icon: Icons.toggleIsolation,
      style: stdStyle
    }
  ]

  const toolsTab = createSection('white', toolButtons.map(b => createButton(b)))
  const buttonsMeasure : IControlBarButtonItem[] = [
    {
      tip: 'Delete',
      action: onMeasureDeleteBtn,
      icon: Icons.trash,
      style: blueStyle
    },
    {
      tip: 'Done',
      action: onMeasureBtn,
      icon: Icons.checkmark,
      style: blueStyle
    }
  ]
  const measureTab = createSection('blue', buttonsMeasure.map(b => createButton(b)))
  const sectionButtons : IControlBarButtonItem[] = [
    {
      tip: 'Reset Section Box',
      action: onResetSectionBtn,
      icon: Icons.sectionBoxReset,
      style: blueStyle
    },
    {
      tip: 'Shrink to Selection',
      action: () => viewer.gizmos.section.fitBox(viewer.selection.getBoundingBox()),
      icon: Icons.sectionBoxShrink,
      style: blueStyle
    },
    {
      tip: section.clip ? 'Clip Section Box' : 'Ignore Section Box',
      action: section.clip ? onSectionClip : onSectionNoClip,
      icon: section.clip ? Icons.sectionBoxClip : Icons.sectionBoxNoClip,
      style: blueStyle
    },
    {
      tip: 'Done',
      action: onSectionBtn,
      icon: Icons.checkmark,
      style: blueStyle
    }
  ]

  const sectionTab = createSection('blue', sectionButtons.map(b => createButton(b)))

  // There is a weird bug with tooltips not working properly
  // if measureTab or sectionTab do not have the same number of buttons as toolstab

  return measuring ? measureTab : section.active ? sectionTab : toolsTab
}

function toggleSectionBox (viewer: VIM.Viewer, isFirst: boolean) {
  if (viewer.inputs.pointerActive === 'rect') {
    viewer.inputs.pointerActive = viewer.inputs.pointerFallback
  }

  const next = !(
    viewer.gizmos.section.visible && viewer.gizmos.section.interactive
  )

  if (next) {
    if (isFirst) {
      viewer.gizmos.section.clip = true
      viewer.gizmos.section.fitBox(viewer.renderer.getBoundingBox().expandByScalar(1))
    }
    if (viewer.gizmos.section.box.containsPoint(viewer.camera.position)) {
      viewer.camera.lerp(1).frame(viewer.renderer.section.box)
    }
  }

  viewer.gizmos.section.interactive = next
  viewer.gizmos.section.visible = next
}
