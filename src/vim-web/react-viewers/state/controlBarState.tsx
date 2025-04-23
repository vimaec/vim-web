import * as Core from "../../core-viewers";
import { CameraRef } from './cameraState';
import { CursorManager } from '../helpers/cursor';

import { Settings, isTrue } from '../settings';

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

/**
 * Returns a control bar section for the section box.
 */
export function controlBarSectionBox(
  section: SectionBoxRef,
  hasSelection : boolean
): ControlBar.IControlBarSection {

  return {
    id: Ids.sectionSectionBox,
    style: section.enable.get()? Style.sectionNoPadStyle : Style.sectionDefaultStyle,
    //enable: () => section.getEnable(),
    buttons: [
      {
        id: Ids.buttonSectionBoxEnable,
        tip: 'Enable Section Box',
        isOn: () => section.enable.get(),
        style: (on) => Style.buttonExpandStyle(on),
        action: () => section.enable.set(!section.enable.get()),
        icon: Icons.sectionBox,
      },
      {
        id: Ids.buttonSectionBoxToSelection,
        tip: 'Fit Section',
        enabled: () => section.enable.get(),
        isOn: () => hasSelection,
        style: (on) => Style.buttonDisableStyle(on),
        action: () => section.sectionSelection.call(), 
        icon: Icons.sectionBoxShrink,
      },
      {
        id: Ids.buttonSectionBoxToScene,
        tip: 'Reset Section',
        enabled: () => section.enable.get(),
        style: (on) => Style.buttonDefaultStyle(on),
        action: () => section.sectionScene.call(), 
        icon: Icons.sectionBoxReset,
      },
      {
        id: Ids.buttonSectionBoxVisible,
        tip: 'Show Section Box',
        enabled: () => section.enable.get(),
        isOn: () => section.visible.get(),
        style: (on) => Style.buttonDefaultStyle(on),
        action: () => section.visible.set(!section.visible.get()),
        icon: Icons.visible,
      },
      {
        id: Ids.buttonSectionBoxAuto,
        tip: 'Auto Section',
        enabled: () => section.enable.get(),
        isOn: () => section.auto.get(),
        style: (on) => Style.buttonDefaultStyle(on),
        action: () => section.auto.set(!section.auto.get()),
        icon: Icons.sectionBoxAuto,
      },
      {
        id: Ids.buttonSectionBoxSettings,
        tip: 'Section Settings',
        enabled: () => section.enable.get(),
        isOn: () => section.showOffsetPanel.get(),
        style: (on) => Style.buttonDefaultStyle(on),
        action: () => section.showOffsetPanel.set(!section.showOffsetPanel.get()),
        icon: Icons.slidersHoriz,
      },
    ],
  };
}

/**
 * Returns a control bar section for pointer/camera modes.
 */
function controlBarPointer(
  viewer: Core.Webgl.Viewer,
  camera: CameraRef,
  settings: Settings,
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
        enabled: () => isTrue(settings.ui.orbit),
        tip: 'Orbit',
        action: () => pointer.onButton(PointerMode.ORBIT),
        icon: Icons.orbit,
        isOn: () => pointer.mode === PointerMode.ORBIT,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.buttonCameraLook,
        enabled: () => isTrue(settings.ui.lookAround),
        tip: 'Look Around',
        action: () => pointer.onButton(PointerMode.LOOK),
        icon: Icons.look,
        isOn: () => pointer.mode === PointerMode.LOOK,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.buttonCameraPan,
        enabled: () => isTrue(settings.ui.pan),
        tip: 'Pan',
        action: () => pointer.onButton(PointerMode.PAN),
        icon: Icons.pan,
        isOn: () => pointer.mode === PointerMode.PAN,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.buttonCameraZoom,
        enabled: () => isTrue(settings.ui.zoom),
        tip: 'Zoom',
        action: () => pointer.onButton(PointerMode.ZOOM),
        icon: Icons.zoom,
        isOn: () => pointer.mode === PointerMode.ZOOM,
        style: Style.buttonDefaultStyle,
      },
    ],
  };
}

export function controlBarMeasure(
  settings: Settings,
  measure: ReturnType<typeof getMeasureState>
){
  return {
    id: Ids.sectionActions,
    enable: () => true,
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.buttonMeasure,
        enabled: () => isTrue(settings.ui.measuringMode),
        isOn: () => measure.active,
        tip: 'Measuring Mode',
        action: () => measure.toggle(),
        icon: Icons.measure,
        style: Style.buttonDefaultStyle,
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

export function controlBarCamera(camera: CameraRef): ControlBar.IControlBarSection {
  return {
    id: Ids.sectionCamera,
    enable: () => true,
    style: Style.sectionDefaultStyle,
    buttons: [
      {
        id: Ids.buttonCameraAuto,
        tip: 'Auto Camera',
        isOn: () => camera.autoCamera.get(),
        action: () => camera.autoCamera.set(!camera.autoCamera.get()),
        icon: Icons.autoCamera,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.buttonCameraFrameSelection,
        // enabled: () => isTrue(settings.ui.zoomToFit), TODO: Implement ui toggles in Ultra
        tip: 'Frame Selection',
        action: () => camera.frameSelection.call(),
        icon: Icons.frameSelection,
        isOn: () => false,
        style: Style.buttonDefaultStyle,
      },
      {
        id: Ids.buttonCameraFrameScene,
        // enabled: () => isTrue(settings.ui.zoomToFit), TODO: Implement ui toggles in Ultra
        tip: 'Frame All',
        action: () => camera.frameScene.call(),
        icon: Icons.frameScene,
        isOn: () => false,
        style: Style.buttonDefaultStyle,
      } 
    ]
  }
}


export function controlBarSelection(isolation: IsolationRef): ControlBar.IControlBarSection {
  const adapter = isolation.adapter.current
  const someVisible = adapter.hasVisibleSelection() || !adapter.hasHiddenSelection()  

  return {
    id: Ids.sectionSelection,
    enable: () => true,
    style: `${Style.sectionDefaultStyle}`,
    buttons: [
      {
        id: Ids.buttonClearSelection,
        tip: 'Clear Selection',
        action: () => adapter.clearSelection(),
        icon: Icons.pointer,
        isOn: () => adapter.hasSelection(),
        style: Style.buttonDisableDefaultStyle,
      },
      {
        id: Ids.buttonShowAll,
        tip: 'Show All',
        action: () =>  adapter.showAll(),
        icon: Icons.showAll,
        isOn: () =>!isolation.autoIsolate.get() && isolation.visibility.get() !== 'all',
        style: Style.buttonDisableStyle,
      },

      {
        id: Ids.buttonHideSelection,
        enabled: () => someVisible,
        tip: 'Hide Selection',
        action: () => adapter.hideSelection(),
        icon: Icons.hideSelection,
        isOn: () =>!isolation.autoIsolate.get() && adapter.hasVisibleSelection(),
        style: Style.buttonDisableStyle,
      },
      {
        id: Ids.buttonShowSelection,
        enabled: () => !someVisible,
        tip: 'Show Selection',
        action: () => adapter.showSelection(),
        icon: Icons.showSelection,
        isOn: () => !isolation.autoIsolate.get() && adapter.hasHiddenSelection(),
        style: Style.buttonDisableStyle,
      },
      {
        id: Ids.buttonIsolateSelection,
        tip: 'Isolate Selection',
        action: () => adapter.isolateSelection(),
        icon: Icons.isolateSelection,
        isOn: () =>!isolation.autoIsolate.get() &&  adapter.hasSelection() && isolation.visibility.get() !== 'onlySelection',
        style: Style.buttonDisableStyle,
      },
      {
        id: Ids.buttonAutoIsolate,
        tip: 'Auto Isolate',
        action: () => isolation.autoIsolate.set(!isolation.autoIsolate.get()),
        isOn: () =>  isolation.autoIsolate.get(),
        icon: Icons.autoIsolate,
      },
      {
        id: Ids.buttonIsolationSettings,
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
  const pointerSection = controlBarPointer(viewer, camera, settings, section);
  const actionSection = controlBarMeasure(settings, measure);
  const sectionBoxSection = controlBarSectionBox(section,viewer.selection.any());
  const settingsSection = controlBarSettings(modal, side, settings);
  const cameraSection = controlBarCamera(camera);
  const selectionSection = controlBarSelection(isolationRef);

  // Apply user customization (note that pointerSection is added twice per original design)
  let controlBarSections = [
    pointerSection,
    actionSection,
    cameraSection,
    sectionBoxSection,
    selectionSection,
    settingsSection
  ];
  controlBarSections = customization?.(controlBarSections) ?? controlBarSections;
  return controlBarSections;
}

/**
 * Checks if any cursor-related UI buttons are enabled
 * @param {Settings} settings - The viewer settings to check
 * @returns {boolean} True if any cursor buttons are enabled
 */
function anyUiCursorButton (settings: Settings) {
  return (
    isTrue(settings.ui.orbit) ||
    isTrue(settings.ui.lookAround) ||
    isTrue(settings.ui.pan) ||
    isTrue(settings.ui.zoom) ||
    isTrue(settings.ui.zoomWindow)
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