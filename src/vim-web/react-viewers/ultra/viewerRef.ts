import { RefObject } from 'react';
import * as Core from '../../core-viewers/ultra';
import { ModalHandle } from '../panels/modal';
import { CameraRef } from '../state/cameraState';
import { SectionBoxRef } from '../state/sectionBoxState';
import { IsolationRef } from '../state/sharedIsolation';
import { ControlBarRef } from '../controlbar';
import { GenericPanelHandle } from '../generic/';
import { SettingsRef } from '../webgl';
import { UltraSettings } from './settings';

export type ViewerRef = {
  /**
   * The Vim viewer instance associated with the viewer.
   */
  core: Core.Viewer;

  /**
   * API to manage the modal dialog.
   */
  modal: ModalHandle;

  /**
   * API to manage the section box.
   */
  sectionBox: SectionBoxRef;

  /**
   * API to customize the control.
   */
  controlBar: ControlBarRef

  /**
   * Camera API to interact with the viewer camera at a higher level.
   */
  camera: CameraRef

  isolation: IsolationRef

  settings: SettingsRef<UltraSettings>
  
  /**
   * API to interact with the isolation panel.
   */
  isolationPanel : GenericPanelHandle

  /**
   * API to interact with the isolation panel.
   */
  sectionBoxPanel : GenericPanelHandle

  /**
   * Disposes of the viewer and its resources.
   */
  dispose: () => void;

  /**
   * Loads a file into the viewer.
   * @param url The URL of the file to load.
   */
  load(url: Core.VimSource): Core.ILoadRequest;
};
