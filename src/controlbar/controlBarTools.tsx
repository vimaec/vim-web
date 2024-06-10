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
import { createBlueButton, createButton } from './controlBarButton'
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

  const btnSection = createButton(
    () => isTrue(props.settings.ui.sectioningMode),
    'Sectioning Mode',
    onSectionBtn,
    Icons.sectionBox
  )

  const btnMeasure = createButton(
    () => isTrue(props.settings.ui.measuringMode),
    'Measuring Mode',
    onMeasureBtn,
    Icons.measure
  )

  const btnIsolation = createButton(
    () => isTrue(props.settings.ui.toggleIsolation),
    'Toggle Isolation',
    () => {
      props.isolation.toggleIsolation('controlBar')
    },
    Icons.toggleIsolation
  )

  const toolsTab = createSection('white', [btnSection, btnMeasure, btnIsolation])

  const btnMeasureDelete = createBlueButton(
    () => true,
    'Delete',
    onMeasureDeleteBtn,
    Icons.trash
  )
  const btnMeasureConfirm = createBlueButton(
    () => true,
    'Done',
    onMeasureBtn,
    Icons.checkmark
  )
  const measureTab = createSection('blue', [btnMeasureDelete, btnMeasureConfirm])

  const btnSectionReset = createBlueButton(
    () => true,
    'Reset Section Box',
    onResetSectionBtn,
    Icons.sectionBoxReset
  )
  const btnSectionShrink = createBlueButton(
    () => true,
    'Shrink to Selection',
    () => viewer.gizmos.section.fitBox(viewer.selection.getBoundingBox()),
    Icons.sectionBoxShrink
  )

  const btnSectionClip = createBlueButton(
    () => true,
    'Apply Section Box',
    onSectionClip,
    Icons.sectionBoxNoClip
  )
  const btnSectionNoClip = createBlueButton(
    () => true,
    'Ignore Section Box',
    onSectionNoClip,
    Icons.sectionBoxClip
  )
  const btnSectionConfirm = createBlueButton(
    () => true,
    'Done',
    onSectionBtn,
    Icons.checkmark
  )

  const sectionTab = createSection('blue', [
    btnSectionReset,
    btnSectionShrink,
    section.clip ? btnSectionNoClip : btnSectionClip,
    btnSectionConfirm
  ])

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
