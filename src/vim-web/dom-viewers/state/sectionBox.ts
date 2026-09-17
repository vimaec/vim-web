import * as THREE from 'three'
import type * as Core from '../../core-viewers'
import type { ISignal } from '../../core-viewers/shared/events'
import { addBox } from '../../utils/threeUtils'
import { createFuncRef, createState, type FuncRef, type StateRef } from '../../state'
import type { SectionBoxSettings } from '../webgl/settings'
import { createSettingState } from './settingState'

export type Offsets = {
  topOffset: string
  sideOffset: string
  bottomOffset: string
}

export type OffsetField = keyof Offsets

/**
 * Controls the section box clipping volume. Shared between WebGL and Ultra.
 *
 * @example
 * viewer.sectionBox.active.set(true)
 * viewer.sectionBox.sectionSelection.call()  // Fit to selection
 * viewer.sectionBox.sectionScene.call()      // Fit to scene
 */
export interface SectionBoxApi {
  active: StateRef<boolean>
  visible: StateRef<boolean>
  auto: StateRef<boolean>

  sectionSelection: FuncRef<void, Promise<void>>
  sectionScene: FuncRef<void, Promise<void>>
  sectionBox: FuncRef<THREE.Box3, void>
  getBox: () => THREE.Box3

  showOffsetPanel: StateRef<boolean>

  topOffset: StateRef<number>
  sideOffset: StateRef<number>
  bottomOffset: StateRef<number>

  getSelectionBox: FuncRef<void, Promise<THREE.Box3 | undefined>>
  getSceneBox: FuncRef<void, Promise<THREE.Box3 | undefined>>
}

export interface ISectionBoxAdapter {
  setActive: (b: boolean) => void
  setVisible: (visible: boolean) => void
  getBox: () => THREE.Box3
  setBox: (box: THREE.Box3) => void
  onSelectionChanged: ISignal
  // Overridable at the viewer level
  getSelectionBox: () => Promise<THREE.Box3 | undefined>
  getSceneBox: () => Promise<THREE.Box3 | undefined>
}

export type SectionBoxHandle = SectionBoxApi & { destroy (): void }

/** The section box clipping volume as observables over a viewer adapter. */
export function createSectionBox (adapter: ISectionBoxAdapter, initial?: SectionBoxSettings): SectionBoxHandle {
  const active = createState(initial?.active ?? false)
  const auto = createState(initial?.auto ?? false)
  // Cannot change these while not active.
  const visible = createSettingState(() => false, { validate: v => active.get() && v })
  const showOffsetPanel = createSettingState(() => false, { validate: v => active.get() && v })
  const topOffset = createState(initial?.topOffset ?? 1)
  const sideOffset = createState(initial?.sideOffset ?? 1)
  const bottomOffset = createState(initial?.bottomOffset ?? 1)

  let requestId = 0
  // The reference box the offsets are applied to.
  let baseBox = adapter.getBox()
  const getSelectionBox = createFuncRef(adapter.getSelectionBox)
  const getSceneBox = createFuncRef(adapter.getSceneBox)

  // Combines the base box with the offsets.
  const sectionBox = createFuncRef((box: THREE.Box3) => {
    if (box === undefined) return
    requestId++
    baseBox = box
    adapter.setBox(addBox(box, offsetsToBox(topOffset.get(), sideOffset.get(), bottomOffset.get())))
  })

  // The selection box, or the scene box without a selection.
  const sectionSelection = createFuncRef(async () => {
    const id = requestId
    const box = (await getSelectionBox.call()) ?? (await getSceneBox.call())
    if (requestId !== id) return // an outdated request
    sectionBox.call(box)
  })

  const sectionScene = createFuncRef(async () => {
    const id = requestId
    const box = await getSceneBox.call()
    if (requestId !== id) return
    sectionBox.call(box)
  })

  adapter.setVisible(false)
  adapter.setActive(false)

  const unsubscribes = [
    adapter.onSelectionChanged.subscribe(() => {
      if (auto.get() && active.get()) sectionSelection.call()
    }),
    // Reset everything when the active state changes.
    active.onChange.subscribe(v => {
      adapter.setActive(v)
      visible.set(v)
      showOffsetPanel.set(false)
      if (v && auto.get()) sectionSelection.call()
      else sectionScene.call()
    }),
    topOffset.onChange.subscribe(() => sectionBox.call(baseBox)),
    sideOffset.onChange.subscribe(() => sectionBox.call(baseBox)),
    bottomOffset.onChange.subscribe(() => sectionBox.call(baseBox)),
    auto.onChange.subscribe(v => { if (v) sectionSelection.call() }),
    visible.onChange.subscribe(v => adapter.setVisible(v))
  ]

  return {
    active,
    visible,
    auto,
    showOffsetPanel,
    topOffset,
    sideOffset,
    bottomOffset,
    sectionSelection,
    sectionScene,
    sectionBox,
    getBox: () => adapter.getBox(),
    getSceneBox,
    getSelectionBox,
    destroy: () => { for (const u of unsubscribes) u() }
  }
}

function offsetsToBox (top: number, side: number, bottom: number) {
  return new THREE.Box3(new THREE.Vector3(-side, -side, -bottom), new THREE.Vector3(side, side, top))
}

export function createWebglSectionBox (viewer: Core.Webgl.Viewer, initial?: SectionBoxSettings) {
  return createSectionBox({
    setActive: b => { viewer.gizmos.sectionBox.active = b },
    setVisible: b => {
      viewer.gizmos.sectionBox.visible = b
      viewer.gizmos.sectionBox.interactive = b
    },
    getBox: () => viewer.gizmos.sectionBox.getBox(),
    setBox: box => viewer.gizmos.sectionBox.setBox(box),
    getSelectionBox: () => Promise.resolve(viewer.selection.getBoundingBox()),
    getSceneBox: () => Promise.resolve(viewer.renderer.getBoundingBox()),
    onSelectionChanged: viewer.selection.onSelectionChanged
  }, initial)
}

export function createUltraSectionBox (viewer: Core.Ultra.Viewer, initial?: SectionBoxSettings) {
  return createSectionBox({
    setActive: b => { viewer.sectionBox.active = b },
    setVisible: b => {
      viewer.sectionBox.visible = b
      viewer.sectionBox.interactive = b
    },
    getBox: () => viewer.sectionBox.getBox(),
    setBox: box => viewer.sectionBox.setBox(box),
    getSelectionBox: () => viewer.selection.getBoundingBox(),
    getSceneBox: () => viewer.renderer.getBoundingBox(),
    onSelectionChanged: viewer.selection.onSelectionChanged
  }, initial)
}
