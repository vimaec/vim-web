import * as VIM from '../../core-viewers/webgl/index';
import { ComponentCamera } from '../helpers/camera';
import { CursorManager } from '../helpers/cursor';
import { Isolation } from '../helpers/isolation';

import {
  ComponentSettings,
  anyUiCursorButton,
  anyUiSettingButton,
  anyUiToolButton,
  isTrue,
} from '../settings/settings';
import { SideState } from '../sidePanel/sideState';
import * as Icons from '../panels/icons';

import { getPointerState } from './pointerState';
import { getFullScreenState } from './fullScreenState';
import { SectionBoxRef } from './sharedSectionBoxState';
import { getMeasureState } from './measureState';
import { ModalRef } from '../panels/modal';

import * as ControlBar from '../controlbar/controlBar';

export const elementIds = {
  // Sections
  sectionCamera: 'controlBar.sectionCamera',
  sectionActions: 'controlBar.sectionActions',
  sectionTools: 'controlBar.sectionTools',
  sectionSettings: 'controlBar.sectionSettings',
  sectionMeasure: 'controlBar.sectionMeasure',
  sectionSectionBox: 'controlBar.sectionSectionBox',

  // Camera buttons
  buttonCameraOrbit: 'controlBar.camera.orbit',
  buttonCameraLook: 'controlBarcamera.look',
  buttonCameraPan: 'controlBar.camera.pan',
  buttonCameraZoom: 'controlBar.camera.zoom',
  buttonCameraZoomWindow: 'controlBar.camera.zoomWindow',

  // Settings buttons
  buttonProjectInspector: 'controlBar.projectInspector',
  buttonSettings: 'controlBar.settings',
  buttonHelp: 'controlBar.help',
  buttonMaximize: 'controlBar.maximize',

  // Action Buttons
  buttonToggleIsolation: 'controlBar.action.toggleIsolation',
  buttonZoomToFit: 'controlBar.action.zoomToFit',

  // Tools buttons
  buttonSectionBox: 'controlBar.sectionBox',
  buttonMeasure: 'controlBar.measure',
  

  // Measure buttons
  buttonMeasureDelete: 'controlBar.measure.delete',
  buttonMeasureDone: 'controlBar.measure.done',

  // Section box buttons
  buttonSectionBoxEnable: 'controlBar.sectionBox.enable',
  buttonSectionBoxVisible: 'controlBar.sectionBox.visible',
  buttonSectionBoxShrinkToSelection: 'controlBar.sectionBox.shrinkToSelection',
  buttonSectionBoxAuto: 'controlBar.sectionBox.auto',
  buttonSectionBoxClip: 'controlBar.sectionBox.clip',
  buttonSectionBoxSettings: 'controlBar.sectionBox.settings',
};

/**
 * Returns a control bar section for the section box.
 */
export function controlBarSectionBox(
  section: SectionBoxRef,
  hasSelection : boolean
): ControlBar.IControlBarSection {


  return {
    id: elementIds.sectionSectionBox,
    enable: () => section.getEnable(),
    buttons: [

      controlBarEnableSectionButton(section),
      {
        id: elementIds.buttonSectionBoxShrinkToSelection,
        tip: 'Fit Section',
        enabled: () => section.getEnable(),
        isOn: () => hasSelection,
        style: (on) => ControlBar.buttonDisableStyle(on),
        action: () => section.sectionSelection(), 
        icon: Icons.sectionBoxShrink,
      },
      {
        id: elementIds.buttonSectionBoxClip,
        tip: 'Reset Section',
        enabled: () => section.getEnable(),
        style: (on) => ControlBar.buttonDefaultStyle(on),
        action: () => section.sectionReset(), 
        icon: Icons.sectionBoxReset,
      },
      {
        id: elementIds.buttonSectionBoxVisible,
        tip: 'Show Section Box',
        enabled: () => section.getEnable(),
        isOn: () => section.getVisible(),
        style: (on) => ControlBar.buttonDefaultStyle(on),
        action: () => section.setVisible(!section.getVisible()),
        icon: Icons.visible,
      },
      {
        id: elementIds.buttonSectionBoxAuto,
        tip: 'Auto Section',
        enabled: () => section.getEnable(),
        isOn: () => section.getAuto(),
        style: (on) => ControlBar.buttonDefaultStyle(on),
        action: () => section.setAuto(!section.getAuto()),
        icon: Icons.sectionBoxAuto,
      },
      {
        id: elementIds.buttonSectionBoxSettings,
        tip: 'Section Settings',
        enabled: () => section.getEnable(),
        isOn: () => section.getOffsetVisible(),
        style: (on) => ControlBar.buttonDefaultStyle(on),
        action: () => section.setOffsetsVisible(!section.getOffsetVisible()),
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
  camera: ComponentCamera,
  settings: ComponentSettings,
  section: SectionBoxRef
): ControlBar.IControlBarSection {
  const pointer = getPointerState(viewer);

  return {
    id: elementIds.sectionCamera,
    enable: () => anyUiCursorButton(settings),
    style: ControlBar.sectionDefaultStyle,
    buttons: [
      {
        id: elementIds.buttonCameraOrbit,
        enabled: () => isTrue(settings.ui.orbit),
        tip: 'Orbit',
        action: () => pointer.onButton('orbit'),
        icon: Icons.orbit,
        isOn: () => pointer.mode === 'orbit',
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: elementIds.buttonCameraLook,
        enabled: () => isTrue(settings.ui.lookAround),
        tip: 'Look Around',
        action: () => pointer.onButton('look'),
        icon: Icons.look,
        isOn: () => pointer.mode === 'look',
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: elementIds.buttonCameraPan,
        enabled: () => isTrue(settings.ui.pan),
        tip: 'Pan',
        action: () => pointer.onButton('pan'),
        icon: Icons.pan,
        isOn: () => pointer.mode === 'pan',
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: elementIds.buttonCameraZoom,
        enabled: () => isTrue(settings.ui.zoom),
        tip: 'Zoom',
        action: () => pointer.onButton('zoom'),
        icon: Icons.zoom,
        isOn: () => pointer.mode === 'zoom',
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: elementIds.buttonCameraZoomWindow,
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

/**
 * Returns a control bar section for measuring actions.
 */
function controlBarMeasure(
  measure: ReturnType<typeof getMeasureState>,
  section: SectionBoxRef
): ControlBar.IControlBarSection {
  return {
    id: elementIds.sectionMeasure,
    // Disable measure actions when the section box is visible
    enable: () => measure.active && !section.getVisible(),
    style: ControlBar.sectionBlueStyle,
    buttons: [
      {
        id: elementIds.buttonMeasureDelete,
        tip: 'Delete',
        action: () => measure.clear(),
        icon: Icons.trash,
        style: ControlBar.buttonBlueStyle,
      },
      {
        id: elementIds.buttonMeasureDone,
        tip: 'Done',
        action: () => measure.toggle(),
        icon: Icons.checkmark,
        style: ControlBar.buttonBlueStyle,
      },
    ],
  };
}

function controlBarEnableSectionButton(section : SectionBoxRef) : ControlBar.IControlBarButtonItem {
  return {
    id: elementIds.buttonSectionBoxEnable,
    tip: 'Enable Section Box',
    isOn: () => section.getEnable(),
    style: (on) => ControlBar.buttonExpandStyle(on),
    action: () => section.setEnable(!section.getEnable()),
    icon: Icons.sectionBox,
  }
}

function controlBarActions(
  camera: ComponentCamera,
  settings: ComponentSettings,
  isolation: Isolation
){
  return {
    id: elementIds.sectionActions,
    enable: () => true,
    style: ControlBar.sectionDefaultStyle,
    buttons: [
      {
        id: elementIds.buttonZoomToFit,
        enabled: () => isTrue(settings.ui.zoomToFit),
        tip: 'Zoom to Fit',
        action: () => camera.frameContext(),
        icon: Icons.frameSelection,
        isOn: () => false,
        style: ControlBar.buttonDefaultStyle,
      },
      {
        id: elementIds.buttonToggleIsolation,
        enabled: () => isTrue(settings.ui.toggleIsolation),
        tip: 'Toggle Isolation',
        action: () => isolation.toggle('controlBar'),
        icon: Icons.toggleIsolation,
        style: ControlBar.buttonDefaultStyle,
      },
    ]
  }
}


/**
 * Returns a control bar section for tool actions.
 */
function controlBarTools(
  measure: ReturnType<typeof getMeasureState>,
  isolation: Isolation,
  settings: ComponentSettings,
  section: SectionBoxRef
): ControlBar.IControlBarSection {
  return {
    id: elementIds.sectionTools,
    enable: () => anyUiToolButton(settings) && !measure.active && !section.getEnable(),
    style: measure.active
      ? ControlBar.sectionBlueStyle
      : ControlBar.sectionDefaultStyle,
    buttons: [
      {
        id: elementIds.buttonMeasure,
        enabled: () => isTrue(settings.ui.measuringMode),
        tip: 'Measuring Mode',
        action: () => measure.toggle(),
        icon: Icons.measure,
        style: ControlBar.buttonDefaultStyle,
      },

      controlBarEnableSectionButton(section),
    ],
  };
}
function controlBarSettings(
  modal: ModalRef,
  side: SideState,
  settings: ComponentSettings): ControlBar.IControlBarSection {
  const fullScreen = getFullScreenState();

  return {
    id: elementIds.sectionSettings,
    enable: () => anyUiSettingButton(settings),
    style: ControlBar.sectionDefaultStyle,
    buttons: [
      {
        id: elementIds.buttonProjectInspector,
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
        id: elementIds.buttonSettings,
        enabled: () => isTrue(settings.ui.settings),
        tip: 'Settings',
        action: () => side.toggleContent('settings'),
        icon: Icons.settings,
        style: ControlBar.buttonDefaultStyle
      },
      {
        id: elementIds.buttonHelp,
        enabled: () => isTrue(settings.ui.help),
        tip: 'Help',
        action: () => modal.help(true),
        icon: Icons.help,
        style: ControlBar.buttonDefaultStyle
      },
      {
        id: elementIds.buttonMaximize,
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


/**
 * Combines all control bar sections into one control bar.
 */
export function useControlBar(
  viewer: VIM.Viewer,
  camera: ComponentCamera,
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
  const actionSection = controlBarActions(camera, settings, isolation);
  const sectionBoxSection = controlBarSectionBox(section,viewer.selection.count > 0);
  const measureSection = controlBarMeasure(measure, section);
  const toolSections = controlBarTools(measure, isolation, settings, section);
  const settingsSection = controlBarSettings(modal, side, settings);

  // Apply user customization (note that pointerSection is added twice per original design)
  let controlBarSections = [
    pointerSection,
    actionSection,
    toolSections,
    measureSection, // Optional section
    sectionBoxSection, // Optional section
    settingsSection
  ];
  controlBarSections = customization?.(controlBarSections) ?? controlBarSections;
  return controlBarSections;
}
