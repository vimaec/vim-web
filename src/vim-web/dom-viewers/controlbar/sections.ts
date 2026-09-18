import { PointerMode } from '../../core-viewers'
import type * as Core from '../../core-viewers'
import type { FramingApi, IsolationApi, SectionBoxApi } from '../api'
import type {
  ControlBarCameraSettings,
  ControlBarCursorSettings,
  ControlBarMeasureSettings,
  ControlBarSectionBoxSettings,
  ControlBarVisibilitySettings
} from '../controlbar/sectionSettings'
import type { UltraSettings } from '../ultra/settings'
import type { WebglSettings } from '../webgl/settings'
import { isTrue } from '../settings/userBoolean'
import { controlBarIds as Ids } from './controlBarIds'
import * as Icons from '../iconSet'
import type { MeasureState, PointerState } from '../state/tools'
import type { ControlBarSection } from './controlBar'

/**
 * The control bar's section definitions — the twin of `controlBarState.tsx`
 * on Dom icons. Every predicate is re-read on `bar.update()`, so the roots
 * call `update(sections())` whenever the underlying state changes.
 */

export function sectionBoxSection (
  section: SectionBoxApi,
  hasSelection: () => boolean,
  settings: ControlBarSectionBoxSettings
): ControlBarSection {
  return {
    id: Ids.sectioningSpan,
    variant: 'default',
    buttons: [
      {
        id: Ids.sectioningEnable,
        enabled: () => isTrue(settings.sectioningEnable),
        tip: () => section.active.get() ? 'Disable Section Box' : 'Enable Section Box',
        isOn: () => section.active.get(),
        variant: 'expand',
        action: () => section.active.set(!section.active.get()),
        icon: Icons.sectionBox
      },
      {
        id: Ids.sectioningFitSelection,
        tip: 'Fit Section',
        enabled: () => section.active.get() && isTrue(settings.sectioningFitToSelection),
        isOn: hasSelection,
        variant: 'disabled',
        action: () => section.sectionSelection.call(),
        icon: Icons.sectionBoxShrink
      },
      {
        id: Ids.sectioningFitScene,
        tip: 'Reset Section',
        enabled: () => section.active.get() && isTrue(settings.sectioningReset),
        action: () => section.sectionScene.call(),
        icon: Icons.sectionBoxReset
      },
      {
        id: Ids.sectioningVisible,
        tip: () => section.visible.get() ? 'Hide Section Box' : 'Show Section Box',
        enabled: () => section.active.get() && isTrue(settings.sectioningShow),
        isOn: () => section.visible.get(),
        action: () => section.visible.set(!section.visible.get()),
        icon: Icons.visible
      },
      {
        id: Ids.sectioningAuto,
        tip: () => section.auto.get() ? 'Disable Auto Section' : 'Auto Section',
        enabled: () => section.active.get() && isTrue(settings.sectioningAuto),
        isOn: () => section.auto.get(),
        action: () => section.auto.set(!section.auto.get()),
        icon: Icons.sectionBoxAuto
      },
      {
        id: Ids.sectioningSettings,
        tip: () => section.showOffsetPanel.get() ? 'Close Section Settings' : 'Section Settings',
        enabled: () => section.active.get() && isTrue(settings.sectioningSettings),
        isOn: () => section.showOffsetPanel.get(),
        action: () => section.showOffsetPanel.set(!section.showOffsetPanel.get()),
        icon: Icons.slidersHoriz
      }
    ]
  }
}

export function pointerSection (pointer: PointerState, settings: ControlBarCursorSettings): ControlBarSection {
  const button = (id: string, mode: Core.PointerMode, tip: string, icon: Icons.IconFactory, enabled: () => boolean) => ({
    id, tip, icon, enabled, action: () => pointer.set(mode), isOn: () => pointer.getMode() === mode
  })
  return {
    id: Ids.cursorSpan,
    enable: () => anyCursorButton(settings),
    variant: 'default',
    buttons: [
      button(Ids.cursorOrbit, PointerMode.ORBIT, 'Orbit', Icons.orbit, () => isTrue(settings.cursorOrbit)),
      button(Ids.cursorLook, PointerMode.LOOK, 'Look Around', Icons.look, () => isTrue(settings.cursorLookAround)),
      button(Ids.cursorPan, PointerMode.PAN, 'Pan', Icons.pan, () => isTrue(settings.cursorPan)),
      button(Ids.cursorZoom, PointerMode.ZOOM, 'Zoom', Icons.zoom, () => isTrue(settings.cursorZoom))
    ]
  }
}

export function measureSection (measure: MeasureState, settings: ControlBarMeasureSettings): ControlBarSection {
  return {
    id: Ids.measureSpan,
    variant: 'default',
    buttons: [
      {
        id: Ids.measureEnable,
        enabled: () => isTrue(settings.measureEnable),
        isOn: () => measure.isActive(),
        tip: () => measure.isActive() ? 'Stop Measuring' : 'Measuring Mode',
        action: () => measure.toggle(),
        icon: Icons.measure
      }
    ]
  }
}

export function cameraSection (camera: FramingApi, settings: ControlBarCameraSettings): ControlBarSection {
  return {
    id: Ids.cameraSpan,
    variant: 'default',
    buttons: [
      {
        id: Ids.cameraAuto,
        enabled: () => isTrue(settings.cameraAuto),
        tip: () => camera.autoCamera.get() ? 'Disable Auto Camera' : 'Auto Camera',
        isOn: () => camera.autoCamera.get(),
        action: () => camera.autoCamera.set(!camera.autoCamera.get()),
        icon: Icons.autoCamera
      },
      {
        id: Ids.cameraFrameSelection,
        enabled: () => isTrue(settings.cameraFrameSelection),
        tip: 'Frame Selection',
        action: () => camera.frameSelection.call(),
        icon: Icons.frameSelection
      },
      {
        id: Ids.cameraFrameScene,
        enabled: () => isTrue(settings.cameraFrameScene),
        tip: 'Frame All',
        action: () => camera.frameScene.call(),
        icon: Icons.frameScene
      }
    ]
  }
}

export function visibilitySection (isolation: IsolationApi, settings: ControlBarVisibilitySettings): ControlBarSection {
  const someVisible = () => isolation.hasVisibleSelection() || !isolation.hasHiddenSelection()
  return {
    id: Ids.visibilitySpan,
    variant: 'default',
    buttons: [
      {
        id: Ids.visibilityClearSelection,
        enabled: () => isTrue(settings.visibilityClearSelection),
        tip: 'Clear Selection',
        action: () => isolation.clearSelection(),
        icon: Icons.pointer,
        isOn: () => isolation.hasSelection(),
        variant: 'disabled-default'
      },
      {
        id: Ids.visibilityShowAll,
        tip: 'Show All',
        dividerBefore: true,
        enabled: () => isTrue(settings.visibilityShowAll),
        action: () => isolation.showAll(),
        icon: Icons.showAll,
        isOn: () => !isolation.autoIsolate.get() && isolation.visibility.get() !== 'all',
        variant: 'disabled'
      },
      {
        id: Ids.visibilityHideSelection,
        enabled: () => someVisible() && isTrue(settings.visibilityToggle),
        tip: 'Hide Selection',
        action: () => isolation.hideSelection(),
        icon: Icons.hideSelection,
        isOn: () => !isolation.autoIsolate.get() && isolation.hasVisibleSelection(),
        variant: 'disabled'
      },
      {
        id: Ids.visibilityShowSelection,
        enabled: () => !someVisible() && isTrue(settings.visibilityToggle),
        tip: 'Show Selection',
        action: () => isolation.showSelection(),
        icon: Icons.showSelection,
        isOn: () => !isolation.autoIsolate.get() && isolation.hasHiddenSelection(),
        variant: 'disabled'
      },
      {
        id: Ids.visibilityIsolateSelection,
        enabled: () => isTrue(settings.visibilityIsolate),
        tip: 'Isolate Selection',
        action: () => isolation.isolateSelection(),
        icon: Icons.isolateSelection,
        isOn: () => !isolation.autoIsolate.get() && isolation.hasVisibleSelection() && isolation.visibility.get() === 'some',
        variant: 'disabled'
      },
      {
        id: Ids.visibilityAutoIsolate,
        enabled: () => isTrue(settings.visibilityAutoIsolate),
        tip: () => isolation.autoIsolate.get() ? 'Disable Auto Isolate' : 'Auto Isolate',
        action: () => isolation.autoIsolate.set(!isolation.autoIsolate.get()),
        isOn: () => isolation.autoIsolate.get(),
        icon: Icons.autoIsolate
      },
      {
        id: Ids.visibilitySettings,
        enabled: () => isTrue(settings.visibilitySettings),
        tip: () => isolation.showPanel.get() ? 'Close Isolation Settings' : 'Isolation Settings',
        action: () => isolation.showPanel.set(!isolation.showPanel.get()),
        icon: Icons.slidersHoriz,
        isOn: () => isolation.showPanel.get()
      }
    ]
  }
}

export function webglControlBarSections (opts: {
  viewer: Core.Webgl.Viewer
  framing: FramingApi
  settings: WebglSettings
  sectionBox: SectionBoxApi
  isolation: IsolationApi
  pointer: PointerState
  measure: MeasureState
}): ControlBarSection[] {
  const { settings } = opts
  return [
    pointerSection(opts.pointer, settings.ui),
    cameraSection(opts.framing, settings.ui),
    visibilitySection(opts.isolation, settings.ui),
    measureSection(opts.measure, settings.ui),
    sectionBoxSection(opts.sectionBox, () => opts.viewer.selection.any(), settings.ui)
  ]
}

export function ultraControlBarSections (opts: {
  viewer: Core.Ultra.Viewer
  framing: FramingApi
  settings: UltraSettings
  sectionBox: SectionBoxApi
  isolation: IsolationApi
}): ControlBarSection[] {
  const { settings } = opts
  return [
    cameraSection(opts.framing, settings.ui),
    visibilitySection(opts.isolation, settings.ui),
    sectionBoxSection(opts.sectionBox, () => opts.viewer.selection.any(), settings.ui)
  ]
}


function anyCursorButton (settings: ControlBarCursorSettings) {
  return isTrue(settings.cursorOrbit) || isTrue(settings.cursorLookAround) || isTrue(settings.cursorPan) || isTrue(settings.cursorZoom)
}


