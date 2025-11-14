import * as Core from "../../core-viewers";
import { CameraRef } from './cameraState';
import { CursorManager } from '../helpers/cursor';

import { Settings, UltraSettings, UserBoolean, isTrue } from '../settings';

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
    id: Ids.sectionSectionBox,
    style: section.enable.get()? Style.sectionNoPadStyle : Style.sectionDefaultStyle,
    //enable: () => section.getEnable(),
    buttons: [
      {
        id: Ids.buttonSectionBoxEnable,
        enabled: () => isTrue(settings.sectioningEnable),
        tip: 'Enable Section Box',
        isOn: () => section.enable.get(),
        style: (on) => Style.buttonExpandStyle(on),
        action: () => section.enable.set(!section.enable.get()),
        icon: Icons.sectionBox,
      },
      {
        id: Ids.buttonSectionBoxToSelection,
        
        tip: 'Fit Section',
        enabled: () => section.enable.get() && isTrue(settings.sectioningFitToSelection),
        isOn: () => hasSelection,
        style: (on) => Style.buttonDisableStyle(on),
        action: () => section.sectionSelection.call(), 
        icon: Icons.sectionBoxShrink,
      },
      {
        id: Ids.buttonSectionBoxToScene,
        tip: 'Reset Section',
        enabled: () => section.enable.get() && isTrue(settings.sectioningReset),
        style: (on) => Style.buttonDefaultStyle(on),
        action: () => section.sectionScene.call(), 
        icon: Icons.sectionBoxReset,
      },
      {
        id: Ids.buttonSectionBoxVisible,
        tip: 'Show Section Box',
        enabled: () => section.enable.get() && isTrue(settings.sectioningShow),
        isOn: () => section.visible.get(),
        style: (on) => Style.buttonDefaultStyle(on),
        action: () => section.visible.set(!section.visible.get()),
        icon: Icons.visible,
      },
      {
        id: Ids.buttonSectionBoxAuto,
        tip: 'Auto Section',
        enabled: () => section.enable.get() && isTrue(settings.sectioningAuto),
        isOn: () => section.auto.get(),
        style: (on) => Style.buttonDefaultStyle(on),
        action: () => section.auto.set(!section.auto.get()),
        icon: Icons.sectionBoxAuto,
      },
      {
        id: Ids.buttonSectionBoxSettings,
        tip: 'Section Settings',
        enabled: () => section.enable.get() && isTrue(settings.sectioningSettings),
        isOn: () => section.showOffsetPanel.get(),
        style: (on) => Style.buttonDefaultStyle(on),
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
  camera: CameraRef,
  settings: ControlBarCursorSettings,
  section: SectionBoxRef
): ControlBar.IControlBarSection {
  const pointer = getPointerState(viewer);

  return {
    id: Ids.sectionInputs,
    enable: () => anyUiCursorButton(settings),
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.buttonCameraOrbit,
        enabled: () => isTrue(settings.cursorOrbit),
        tip: 'Orbit',
        action: () => pointer.onButton(PointerMode.ORBIT),
        icon: Icons.orbit,
        isOn: () => pointer.mode === PointerMode.ORBIT,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.buttonCameraLook,
        enabled: () => isTrue(settings.cursorLookAround),
        tip: 'Look Around',
        action: () => pointer.onButton(PointerMode.LOOK),
        icon: Icons.look,
        isOn: () => pointer.mode === PointerMode.LOOK,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.buttonCameraPan,
        enabled: () => isTrue(settings.cursorPan),
        tip: 'Pan',
        action: () => pointer.onButton(PointerMode.PAN),
        icon: Icons.pan,
        isOn: () => pointer.mode === PointerMode.PAN,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.buttonCameraZoom,
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
  measuringMode: UserBoolean
}

export function controlBarMeasure(
  measure: ReturnType<typeof getMeasureState>,
  settings: ControlBarMeasureSettings
){
  return {
    id: Ids.sectionActions,
    enable: () => true,
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.buttonMeasure,
        enabled: () => isTrue(settings.measuringMode),
        isOn: () => measure.active,
        tip: 'Measuring Mode',
        action: () => measure.toggle(),
        icon: Icons.measure,
        style: Style.buttonDefaultStyle,
      },
    ]
  }
}

export function controlBarSettingsUltra(
  side: SideState,
  settings: UltraSettings): ControlBar.IControlBarSection {

  return {
    id: Ids.sectionSettings,
    enable: () => isTrue(settings.ui.settings),
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.buttonSettings,
        enabled: () => isTrue(settings.ui.settings),
        tip: 'Settings',
        action: () => side.toggleContent('settings'),
        icon: Icons.settings,
        style: Style.buttonDefaultStyle
      },
    ]
  }
}

function controlBarSettings(
  modal: ModalHandle,
  side: SideState,
  settings: Settings): ControlBar.IControlBarSection {
  const fullScreen = getFullScreenState();

  return {
    id: Ids.sectionSettings,
    enable: () => anyUiSettingButton(settings),
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.buttonProjectInspector,
        enabled: () => isTrue(settings.ui.projectInspector) && (
          isTrue(settings.ui.bimTreePanel) ||
          isTrue(settings.ui.bimInfoPanel)
        ),
        tip: 'Project Inspector',
        action: () => side.toggleContent('bim'),
        icon: Icons.treeView,
        style: Style.buttonDefaultStyle
      },
      {
        id: Ids.buttonSettings,
        enabled: () => isTrue(settings.ui.settings),
        tip: 'Settings',
        action: () => side.toggleContent('settings'),
        icon: Icons.settings,
        style: Style.buttonDefaultStyle
      },
      {
        id: Ids.buttonHelp,
        enabled: () => isTrue(settings.ui.help),
        tip: 'Help',
        action: () => modal.help(true),
        icon: Icons.help,
        style: Style.buttonDefaultStyle
      },
      {
        id: Ids.buttonMaximize,
        enabled: () =>
          isTrue(settings.ui.maximise) &&
          settings.capacity.canGoFullScreen,
        tip: fullScreen.get() ? 'Minimize' : 'Fullscreen',
        action: () => fullScreen.toggle(),
        icon: fullScreen.get() ? Icons.minimize : Icons.fullsScreen,
        style: Style.buttonDefaultStyle
      }
    ]
  }
}

export type ControlBarCameraSettings ={
  cameraAuto : UserBoolean
  cameraFrameSelection: UserBoolean
  cameraFrameScene: UserBoolean
}

export function controlBarCamera(camera: CameraRef, settings: ControlBarCameraSettings): ControlBar.IControlBarSection {
  return {
    id: Ids.sectionCamera,
    enable: () => true,
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.buttonCameraAuto,
        enabled: () => isTrue(settings.cameraAuto),
        tip: 'Auto Camera',
        isOn: () => camera.autoCamera.get(),
        action: () => camera.autoCamera.set(!camera.autoCamera.get()),
        icon: Icons.autoCamera,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.buttonCameraFrameSelection,
        enabled: () => isTrue(settings.cameraFrameSelection),
        tip: 'Frame Selection',
        action: () => camera.frameSelection.call(),
        icon: Icons.frameSelection,
        isOn: () => false,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.buttonCameraFrameScene,
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
    visibilityEnable: UserBoolean
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
    id: Ids.sectionSelection,
    enable: () => true,
    style: `${Style.sectionDefaultStyle}`,
    buttons: [
      {
        id: Ids.buttonClearSelection,
        enabled: () => isTrue(settings.visibilityClearSelection),
        tip: 'Clear Selection',
        action: () => adapter.clearSelection(),
        icon: Icons.pointer,
        isOn: () => adapter.hasSelection(),
        style: Style.buttonDisableDefaultStyle,
      },
      {
        id: Ids.buttonShowAll,
        tip: 'Show All',
        enabled: () => isTrue(settings.visibilityShowAll),
        action: () =>  adapter.showAll(),
        icon: Icons.showAll,
        isOn: () =>!isolation.autoIsolate.get() && isolation.visibility.get() !== 'all',
        style: Style.buttonDisableStyle,
      },

      {
        id: Ids.buttonHideSelection,
        enabled: () => someVisible && isTrue(settings.visibilityToggle),
        tip: 'Hide Selection',
        action: () => adapter.hideSelection(),
        icon: Icons.hideSelection,
        isOn: () =>!isolation.autoIsolate.get() && adapter.hasVisibleSelection(),
        style: Style.buttonDisableStyle,
      },
      {
        id: Ids.buttonShowSelection,
        enabled: () => !someVisible && isTrue(settings.visibilityToggle),
        tip: 'Show Selection',
        action: () => adapter.showSelection(),
        icon: Icons.showSelection,
        isOn: () => !isolation.autoIsolate.get() && adapter.hasHiddenSelection(),
        style: Style.buttonDisableStyle,
      },
      {
        id: Ids.buttonIsolateSelection,
        enabled: () => isTrue(settings.visibilityIsolate),
        tip: 'Isolate Selection',
        action: () => adapter.isolateSelection(),
        icon: Icons.isolateSelection,
        isOn: () =>!isolation.autoIsolate.get() &&  adapter.hasSelection() && isolation.visibility.get() !== 'onlySelection',
        style: Style.buttonDisableStyle,
      },
      {
        id: Ids.buttonAutoIsolate,
        enabled: () => isTrue(settings.visibilityAutoIsolate),
        tip: 'Auto Isolate',
        action: () => isolation.autoIsolate.set(!isolation.autoIsolate.get()),
        isOn: () =>  isolation.autoIsolate.get(),
        icon: Icons.autoIsolate,
      },
      {
        id: Ids.buttonIsolationSettings,
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
  settings: Settings,
  section: SectionBoxRef,
  isolationRef: IsolationRef,
  customization: ControlBar.ControlBarCustomization | undefined
) {
  const measure = getMeasureState(viewer, cursor);

  // Apply user customization (note that pointerSection is added twice per original design)
  let controlBarSections = [
    controlBarPointer(viewer, camera, settings.ui, section),
    controlBarCamera(camera, settings.ui),
    controlBarVisibility(isolationRef, settings.ui),
    controlBarMeasure(measure, settings.ui),
    controlBarSectionBox(section, viewer.selection.any(), settings.ui),
    controlBarSettings(modal, side, settings)
  ];
  controlBarSections = customization?.(controlBarSections) ?? controlBarSections;
  return controlBarSections;
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
export function anyUiSettingButton (settings: Settings) {
  return (
    isTrue(settings.ui.projectInspector) ||
    isTrue(settings.ui.settings) ||
    isTrue(settings.ui.help) ||
    isTrue(settings.ui.maximise)
  )
}