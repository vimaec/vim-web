import * as VIM from '../../core-viewers/webgl/index';
import { CameraRef } from './cameraState';
import { CursorManager } from '../helpers/cursor';
import { Isolation } from '../helpers/isolation';

import {
  ComponentSettings,
  anyUiCursorButton,
  anyUiSettingButton,
  isTrue,
} from '../settings/settings';
import { SideState } from '../sidePanel/sideState';
import * as Icons from '../panels/icons';

import { getPointerState } from './pointerState';
import { getFullScreenState } from './fullScreenState';
import { SectionBoxRef } from './sectionBoxState';
import { getMeasureState } from './measureState';
import { ModalRef } from '../panels/modal';

import * as ControlBar from '../controlbar/controlBar';

/**
 * Returns a control bar section for the section box.
 */
export function controlBarSectionBox(
  section: SectionBoxRef,
  hasSelection : boolean
): ControlBar.IControlBarSection {

  return {
    id: ControlBar.ids.sectionSectionBox,
    style: section.enable.get()? ControlBar.sectionNoPadStyle : ControlBar.sectionDefaultStyle,
    //enable: () => section.getEnable(),
    buttons: [
      {
        id: ControlBar.ids.buttonSectionBoxEnable,
        tip: 'Enable Section Box',
        isOn: () => section.enable.get(),
        style: (on) => ControlBar.buttonExpandStyle(on),
        action: () => section.enable.set(!section.enable.get()),
        icon: Icons.sectionBox,
      },
      {
        id: ControlBar.ids.buttonSectionBoxShrinkToSelection,
        tip: 'Fit Section',
        enabled: () => section.enable.get(),
        isOn: () => hasSelection,
        style: (on) => ControlBar.buttonDisableStyle(on),
        action: () => section.sectionSelection.call(), 
        icon: Icons.sectionBoxShrink,
      },
      {
        id: ControlBar.ids.buttonSectionBoxReset,
        tip: 'Reset Section',
        enabled: () => section.enable.get(),
        style: (on) => ControlBar.buttonDefaultStyle(on),
        action: () => section.sectionReset.call(), 
        icon: Icons.sectionBoxReset,
      },
      {
        id: ControlBar.ids.buttonSectionBoxVisible,
        tip: 'Show Section Box',
        enabled: () => section.enable.get(),
        isOn: () => section.visible.get(),
        style: (on) => ControlBar.buttonDefaultStyle(on),
        action: () => section.visible.set(!section.visible.get()),
        icon: Icons.visible,
      },
      {
        id: ControlBar.ids.buttonSectionBoxAuto,
        tip: 'Auto Section',
        enabled: () => section.enable.get(),
        isOn: () => section.auto.get(),
        style: (on) => ControlBar.buttonDefaultStyle(on),
        action: () => section.auto.set(!section.auto.get()),
        icon: Icons.sectionBoxAuto,
      },
      {
        id: ControlBar.ids.buttonSectionBoxSettings,
        tip: 'Section Settings',
        enabled: () => section.enable.get(),
        isOn: () => section.showOffsetPanel.get(),
        style: (on) => ControlBar.buttonDefaultStyle(on),
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
  viewer: VIM.Viewer,
  camera: CameraRef,
  settings: ComponentSettings,
  section: SectionBoxRef
): ControlBar.IControlBarSection {
  const pointer = getPointerState(viewer);

  return {
    id: ControlBar.ids.sectionInputs,
    enable: () => anyUiCursorButton(settings),
    style: ControlBar.sectionDefaultStyle,
    buttons: [
      {
        id: ControlBar.ids.buttonCameraOrbit,
        enabled: () => isTrue(settings.ui.orbit),
        tip: 'Orbit',
        action: () => pointer.onButton('orbit'),
        icon: Icons.orbit,
        isOn: () => pointer.mode === 'orbit',
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: ControlBar.ids.buttonCameraLook,
        enabled: () => isTrue(settings.ui.lookAround),
        tip: 'Look Around',
        action: () => pointer.onButton('look'),
        icon: Icons.look,
        isOn: () => pointer.mode === 'look',
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: ControlBar.ids.buttonCameraPan,
        enabled: () => isTrue(settings.ui.pan),
        tip: 'Pan',
        action: () => pointer.onButton('pan'),
        icon: Icons.pan,
        isOn: () => pointer.mode === 'pan',
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: ControlBar.ids.buttonCameraZoom,
        enabled: () => isTrue(settings.ui.zoom),
        tip: 'Zoom',
        action: () => pointer.onButton('zoom'),
        icon: Icons.zoom,
        isOn: () => pointer.mode === 'zoom',
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: ControlBar.ids.buttonCameraZoomWindow,
        enabled: () => isTrue(settings.ui.zoomWindow),
        tip: 'Zoom Window',
        action: () => {
          pointer.onButton('rect');
        },
        icon: Icons.frameRect,
        isOn: () => pointer.mode === 'rect',
        style: ControlBar.buttonDefaultStyle,
      },

    ],
  };
}

function controlBarActions(
  camera: CameraRef,
  settings: ComponentSettings,
  isolation: Isolation,
  measure: ReturnType<typeof getMeasureState>
){
  return {
    id: ControlBar.ids.sectionActions,
    enable: () => true,
    style: ControlBar.sectionDefaultStyle,
    buttons: [
      {
        id: ControlBar.ids.buttonZoomToFit,
        enabled: () => isTrue(settings.ui.zoomToFit),
        tip: 'Zoom to Fit',
        action: () => camera.frameSelection.call(),
        icon: Icons.frameSelection,
        isOn: () => false,
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: ControlBar.ids.buttonToggleIsolation,
        enabled: () => isTrue(settings.ui.toggleIsolation),
        tip: 'Toggle Isolation',
        action: () => isolation.toggle('controlBar'),
        icon: Icons.toggleIsolation,
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: ControlBar.ids.buttonMeasure,
        enabled: () => isTrue(settings.ui.measuringMode),
        isOn: () => measure.active,
        tip: 'Measuring Mode',
        action: () => measure.toggle(),
        icon: Icons.measure,
        style: ControlBar.buttonDefaultStyle,
      },
    ]
  }
}

function controlBarSettings(
  modal: ModalRef,
  side: SideState,
  settings: ComponentSettings): ControlBar.IControlBarSection {
  const fullScreen = getFullScreenState();

  return {
    id: ControlBar.ids.sectionSettings,
    enable: () => anyUiSettingButton(settings),
    style: ControlBar.sectionDefaultStyle,
    buttons: [
      {
        id: ControlBar.ids.buttonProjectInspector,
        enabled: () => isTrue(settings.ui.projectInspector) && (
          isTrue(settings.ui.bimTreePanel) ||
          isTrue(settings.ui.bimInfoPanel)
        ),
        tip: 'Project Inspector',
        action: () => side.toggleContent('bim'),
        icon: Icons.treeView,
        style: ControlBar.buttonDefaultStyle
      },
      {
        id: ControlBar.ids.buttonSettings,
        enabled: () => isTrue(settings.ui.settings),
        tip: 'Settings',
        action: () => side.toggleContent('settings'),
        icon: Icons.settings,
        style: ControlBar.buttonDefaultStyle
      },
      {
        id: ControlBar.ids.buttonHelp,
        enabled: () => isTrue(settings.ui.help),
        tip: 'Help',
        action: () => modal.help(true),
        icon: Icons.help,
        style: ControlBar.buttonDefaultStyle
      },
      {
        id: ControlBar.ids.buttonMaximize,
        enabled: () =>
          isTrue(settings.ui.maximise) &&
          settings.capacity.canGoFullScreen,
        tip: fullScreen.get() ? 'Minimize' : 'Fullscreen',
        action: () => fullScreen.toggle(),
        icon: fullScreen.get() ? Icons.minimize : Icons.fullsScreen,
        style: ControlBar.buttonDefaultStyle
      }
    ]
  }
}

export function controlBarCamera(camera: CameraRef){
  return {
    id: ControlBar.ids.sectionCamera,
    enable: () => true,
    style: ControlBar.sectionDefaultStyle,
    buttons: [
      {
        id: ControlBar.ids.buttonCameraAuto,
        tip: 'Auto Camera',
        isOn: () => camera.autoCamera.get(),
        action: () => camera.autoCamera.set(!camera.autoCamera.get()),
        icon: Icons.autoCamera,
        style: ControlBar.buttonDefaultStyle,
      },
    ]
  }
}


/**
 * Combines all control bar sections into one control bar.
 */
export function useControlBar(
  viewer: VIM.Viewer,
  camera: CameraRef,
  modal: ModalRef,
  side: SideState,
  isolation: Isolation,
  cursor: CursorManager,
  settings: ComponentSettings,
  section: SectionBoxRef,
  customization: ControlBar.ControlBarCustomization | undefined
) {
  const measure = getMeasureState(viewer, cursor);
  const pointerSection = controlBarPointer(viewer, camera, settings, section);
  const actionSection = controlBarActions(camera, settings, isolation, measure);
  const sectionBoxSection = controlBarSectionBox(section,viewer.selection.count > 0);
  const settingsSection = controlBarSettings(modal, side, settings);
  const cameraSection = controlBarCamera(camera);


  // Apply user customization (note that pointerSection is added twice per original design)
  let controlBarSections = [
    pointerSection,
    actionSection,
    cameraSection,
    sectionBoxSection, // Optional section
    settingsSection
  ];
  controlBarSections = customization?.(controlBarSections) ?? controlBarSections;
  return controlBarSections;
}
