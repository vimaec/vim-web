import * as Core from "../../core-viewers";
import { CameraRef } from './cameraState';
import { CursorManager } from '../helpers/cursor';

import { SideState } from './sideState';
import * as Icons from '../icons';

import { getPointerState } from './pointerState';
import { getFullScreenState } from './fullScreenState';
import { SectionBoxRef } from './sectionBoxState';
import { getMeasureState } from './measureState';
import { ModalHandle } from '../panels/modal';

import { IsolationRef } from './sharedIsolation';
import { PointerMode } from '../../core-viewers/shared';

import * as ControlBar from '../controlbar'
import Style = ControlBar.Style;
import Ids = ControlBar.Ids;
import { isFalse, isTrue, UserBoolean } from "../settings/userBoolean";
import { UltraSettings } from "../ultra/settings";
import { WebglSettings } from "../webgl/settings";
import { AnySettings } from "../settings";

export type ControlBarSectionBoxSettings = {
  sectioningEnable: UserBoolean
  sectioningFitToSelection: UserBoolean
  sectioningReset: UserBoolean
  sectioningShow: UserBoolean
  sectioningAuto: UserBoolean
  sectioningSettings: UserBoolean
}

/**
 * Returns a control bar section for the section box.
 */
export function controlBarSectionBox(
  section: SectionBoxRef,
  hasSelection : boolean,
  settings: ControlBarSectionBoxSettings
): ControlBar.IControlBarSection {

  return {
    id: Ids.sectioningSpan,
    style: section.enable.get()? Style.sectionNoPadStyle : Style.sectionDefaultStyle,
    //enable: () => section.getEnable(),
    buttons: [
      {
        id: Ids.sectioningEnable,
        enabled: () => isTrue(settings.sectioningEnable),
        tip: 'Enable Section Box',
        isOn: () => section.enable.get(),
        style: Style.buttonExpandStyle,
        action: () => section.enable.set(!section.enable.get()),
        icon: Icons.sectionBox,
      },
      {
        id: Ids.sectioningFitSelection,
        
        tip: 'Fit Section',
        enabled: () => section.enable.get() && isTrue(settings.sectioningFitToSelection),
        isOn: () => hasSelection,
        style: Style.buttonDisableStyle,
        action: () => section.sectionSelection.call(), 
        icon: Icons.sectionBoxShrink,
      },
      {
        id: Ids.sectioningFitScene,
        tip: 'Reset Section',
        enabled: () => section.enable.get() && isTrue(settings.sectioningReset),
        style: Style.buttonDefaultStyle,
        action: () => section.sectionScene.call(), 
        icon: Icons.sectionBoxReset,
      },
      {
        id: Ids.sectioningVisible,
        tip: 'Show Section Box',
        enabled: () => section.enable.get() && isTrue(settings.sectioningShow),
        isOn: () => section.visible.get(),
        style: Style.buttonDefaultStyle,
        action: () => section.visible.set(!section.visible.get()),
        icon: Icons.visible,
      },
      {
        id: Ids.sectioningAuto,
        tip: 'Auto Section',
        enabled: () => section.enable.get() && isTrue(settings.sectioningAuto),
        isOn: () => section.auto.get(),
        style: Style.buttonDefaultStyle,
        action: () => section.auto.set(!section.auto.get()),
        icon: Icons.sectionBoxAuto,
      },
      {
        id: Ids.sectioningSettings,
        tip: 'Section Settings',
        enabled: () => section.enable.get() && isTrue(settings.sectioningSettings),
        isOn: () => section.showOffsetPanel.get(),
        style: Style.buttonDefaultStyle,
        action: () => section.showOffsetPanel.set(!section.showOffsetPanel.get()),
        icon: Icons.slidersHoriz,
      },
    ],
  };
}

export type ControlBarCursorSettings = {
  cursorOrbit: UserBoolean
  cursorLookAround: UserBoolean
  cursorPan: UserBoolean
  cursorZoom: UserBoolean
}

/**
 * Returns a control bar section for pointer/camera modes.
 */
function controlBarPointer(
  viewer: Core.Webgl.Viewer,
  settings: ControlBarCursorSettings,
): ControlBar.IControlBarSection {
  const pointer = getPointerState(viewer);

  return {
    id: Ids.cursorSpan,
    enable: () => anyUiCursorButton(settings),
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.cursorOrbit,
        enabled: () => isTrue(settings.cursorOrbit),
        tip: 'Orbit',
        action: () => pointer.onButton(PointerMode.ORBIT),
        icon: Icons.orbit,
        isOn: () => pointer.mode === PointerMode.ORBIT,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.cursorLook,
        enabled: () => isTrue(settings.cursorLookAround),
        tip: 'Look Around',
        action: () => pointer.onButton(PointerMode.LOOK),
        icon: Icons.look,
        isOn: () => pointer.mode === PointerMode.LOOK,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.cursorPan,
        enabled: () => isTrue(settings.cursorPan),
        tip: 'Pan',
        action: () => pointer.onButton(PointerMode.PAN),
        icon: Icons.pan,
        isOn: () => pointer.mode === PointerMode.PAN,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.cursorZoom,
        enabled: () => isTrue(settings.cursorZoom),
        tip: 'Zoom',
        action: () => pointer.onButton(PointerMode.ZOOM),
        icon: Icons.zoom,
        isOn: () => pointer.mode === PointerMode.ZOOM,
        style: Style.buttonDefaultStyle,
      },
    ],
  };
}

export type ControlBarMeasureSettings = {
  measureEnable: UserBoolean
}

export function controlBarMeasure(
  measure: ReturnType<typeof getMeasureState>,
  settings: ControlBarMeasureSettings
){
  return {
    id: Ids.measureSpan,
    enable: () => true,
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.measureEnable,
        enabled: () => isTrue(settings.measureEnable),
        isOn: () => measure.active,
        tip: 'Measuring Mode',
        action: () => measure.toggle(),
        icon: Icons.measure,
        style: Style.buttonDefaultStyle,
      },
    ]
  }
}
// Shared misc button builders
function createMiscSettingsButton(
  side: SideState,
  settings: AnySettings
) {
  return {
    id: Ids.miscSettings,
    enabled: () => isTrue(settings.ui.miscSettings),
    tip: 'Settings',
    action: () => side.toggleContent('settings'),
    icon: Icons.settings,
    style: Style.buttonDefaultStyle
  };
}

function createMiscHelpButton(
  modal : ModalHandle,
  settings: AnySettings,
){
  return {
    id: Ids.miscHelp,
    enabled: () => isTrue(settings.ui.miscHelp),
    tip: 'Help',
    action: () => modal.help(true),
    icon: Icons.help,
    style: Style.buttonDefaultStyle
  };
}

// Ultra version
export function controlBarMiscUltra(
  modal : ModalHandle,
  side: SideState,
  settings: UltraSettings
): ControlBar.IControlBarSection {
  return {
    id: Ids.miscSpan,
    enable: () => anyUltraMiscButton(settings),
    style: Style.sectionDefaultStyle,
    buttons: [
      createMiscSettingsButton(side, settings),
      createMiscHelpButton(modal, settings)
    ]
  };
}

// WebGL version
function controlBarMisc(
  modal: ModalHandle,
  side: SideState,
  settings: WebglSettings
): ControlBar.IControlBarSection {
  const fullScreen = getFullScreenState();

  return {
    id: Ids.miscSpan,
    enable: () => anyWebglMiscButton(settings),
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.miscInspector,
        enabled: () => showBimButton(settings),
        tip: 'Project Inspector',
        action: () => side.toggleContent('bim'),
        icon: Icons.treeView,
        style: Style.buttonDefaultStyle
      },
      createMiscSettingsButton(side, settings),
      createMiscHelpButton(modal, settings),
      {
        id: Ids.miscMaximize,
        enabled: () =>
          isTrue(settings.ui.miscMaximise) &&
          settings.capacity.canGoFullScreen,
        tip: fullScreen.get() ? 'Minimize' : 'Fullscreen',
        action: () => fullScreen.toggle(),
        icon: fullScreen.get() ? Icons.minimize : Icons.fullsScreen,
        style: Style.buttonDefaultStyle
      }
    ]
  };
}

export type ControlBarCameraSettings ={
  cameraAuto : UserBoolean
  cameraFrameSelection: UserBoolean
  cameraFrameScene: UserBoolean
}

export function controlBarCamera(camera: CameraRef, settings: ControlBarCameraSettings): ControlBar.IControlBarSection {
  return {
    id: Ids.cameraSpan,
    enable: () => true,
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.cameraAuto,
        enabled: () => isTrue(settings.cameraAuto),
        tip: 'Auto Camera',
        isOn: () => camera.autoCamera.get(),
        action: () => camera.autoCamera.set(!camera.autoCamera.get()),
        icon: Icons.autoCamera,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.cameraFrameSelection,
        enabled: () => isTrue(settings.cameraFrameSelection),
        tip: 'Frame Selection',
        action: () => camera.frameSelection.call(),
        icon: Icons.frameSelection,
        isOn: () => false,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.cameraFrameScene,
        enabled: () => isTrue(settings.cameraFrameScene),
        tip: 'Frame All',
        action: () => camera.frameScene.call(),
        icon: Icons.frameScene,
        isOn: () => false,
        style: Style.buttonDefaultStyle,
      } 
    ]
  }
}

export type ControlBarVisibilitySettings = {
    visibilityClearSelection: UserBoolean
    visibilityShowAll: UserBoolean
    visibilityToggle: UserBoolean
    visibilityIsolate: UserBoolean
    visibilityAutoIsolate: UserBoolean
    visibilitySettings: UserBoolean
}

export function controlBarVisibility(isolation: IsolationRef, settings: ControlBarVisibilitySettings): ControlBar.IControlBarSection {
  const adapter = isolation.adapter.current
  const someVisible = adapter.hasVisibleSelection() || !adapter.hasHiddenSelection()  

  return {
    id: Ids.visibilitySpan,
    enable: () => true,
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.visibilityClearSelection,
        enabled: () => isTrue(settings.visibilityClearSelection),
        tip: 'Clear Selection',
        action: () => adapter.clearSelection(),
        icon: Icons.pointer,
        isOn: () => adapter.hasSelection(),
        style: Style.buttonDisableDefaultStyle,
      },
      {
        id: Ids.visibilityShowAll,
        tip: 'Show All',
        enabled: () => isTrue(settings.visibilityShowAll),
        action: () =>  adapter.showAll(),
        icon: Icons.showAll,
        isOn: () =>!isolation.autoIsolate.get() && isolation.visibility.get() !== 'all',
        style: Style.buttonDisableStyle,
      },

      {
        id: Ids.visibilityHideSelection,
        enabled: () => someVisible && isTrue(settings.visibilityToggle),
        tip: 'Hide Selection',
        action: () => adapter.hideSelection(),
        icon: Icons.hideSelection,
        isOn: () =>!isolation.autoIsolate.get() && adapter.hasVisibleSelection(),
        style: Style.buttonDisableStyle,
      },
      {
        id: Ids.visibilityShowSelection,
        enabled: () => !someVisible && isTrue(settings.visibilityToggle),
        tip: 'Show Selection',
        action: () => adapter.showSelection(),
        icon: Icons.showSelection,
        isOn: () => !isolation.autoIsolate.get() && adapter.hasHiddenSelection(),
        style: Style.buttonDisableStyle,
      },
      {
        id: Ids.visibilityIsolateSelection,
        enabled: () => isTrue(settings.visibilityIsolate),
        tip: 'Isolate Selection',
        action: () => adapter.isolateSelection(),
        icon: Icons.isolateSelection,
        isOn: () =>!isolation.autoIsolate.get() &&  adapter.hasSelection() && isolation.visibility.get() !== 'onlySelection',
        style: Style.buttonDisableStyle,
      },
      {
        id: Ids.visibilityAutoIsolate,
        enabled: () => isTrue(settings.visibilityAutoIsolate),
        tip: 'Auto Isolate',
        action: () => isolation.autoIsolate.set(!isolation.autoIsolate.get()),
        isOn: () =>  isolation.autoIsolate.get(),
        icon: Icons.autoIsolate,
      },
      {
        id: Ids.visibilitySettings,
        enabled: () => isTrue(settings.visibilitySettings),
        tip: 'Isolation Settings',
        action: () => isolation.showPanel.set(!isolation.showPanel.get()),
        icon: Icons.slidersHoriz,
        isOn: () => isolation.showPanel.get(),
      }
    ]
  }
}

/**
 * Combines all control bar sections into one control bar.
 */
export function useControlBar(
  viewer: Core.Webgl.Viewer,
  camera: CameraRef,
  modal: ModalHandle,
  side: SideState,
  cursor: CursorManager,
  settings: WebglSettings,
  section: SectionBoxRef,
  isolationRef: IsolationRef,
  customization: ControlBar.ControlBarCustomization | undefined
) {
  const measure = getMeasureState(viewer, cursor);

  // Apply user customization (note that pointerSection is added twice per original design)
  let controlBarSections = [
    controlBarPointer(viewer, settings.ui),
    controlBarCamera(camera, settings.ui),
    controlBarVisibility(isolationRef, settings.ui),
    controlBarMeasure(measure, settings.ui),
    controlBarSectionBox(section, viewer.selection.any(), settings.ui),
    controlBarMisc(modal, side, settings)
  ];
  controlBarSections = customization?.(controlBarSections) ?? controlBarSections;
  return controlBarSections;
}


function showBimButton(settings: WebglSettings){
if(isFalse(settings.ui.miscProjectInspector)) return false
  if(isTrue(settings.ui.panelBimTree) ) return true
  if(isTrue(settings.ui.panelBimInfo) ) return true
  return false
}


/**
 * Checks if any cursor-related UI buttons are enabled
 * @param {Settings} settings - The viewer settings to check
 * @returns {boolean} True if any cursor buttons are enabled
 */
function anyUiCursorButton (settings: ControlBarCursorSettings) {
  return (
    isTrue(settings.cursorOrbit) ||
    isTrue(settings.cursorLookAround) ||
    isTrue(settings.cursorPan) ||
    isTrue(settings.cursorZoom)
  )
}

/**
 * Checks if any settings-related UI buttons are enabled
 * @param {Settings} settings - The viewer settings to check
 * @returns {boolean} True if any settings buttons are enabled
 */
export function anyWebglMiscButton (settings: WebglSettings) {
  return (
    isTrue(settings.ui.miscProjectInspector) ||
    isTrue(settings.ui.miscSettings) ||
    isTrue(settings.ui.miscHelp) ||
    isTrue(settings.ui.miscMaximise)
  )
}

export function anyUltraMiscButton (settings: UltraSettings) {
  return (
    isTrue(settings.ui.miscSettings) ||
    isTrue(settings.ui.miscHelp)
  )
}
