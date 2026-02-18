import { RefObject } from 'react';
import * as Core from '../../core-viewers/ultra';
import { ModalHandle } from '../panels/modal';
import { CameraApi } from '../state/cameraState';
import { SectionBoxApi } from '../state/sectionBoxState';
import { IsolationApi } from '../state/sharedIsolation';
import { ControlBarApi } from '../controlbar';
import { GenericPanelHandle } from '../generic/';
import { SettingsApi } from '../webgl';
import { UltraSettings } from './settings';

export type ViewerApi = {
  /**
   * Discriminant to distinguish Ultra from WebGL viewer.
   */
  type: 'ultra'

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
  sectionBox: SectionBoxApi;

  /**
   * API to customize the control.
   */
  controlBar: ControlBarApi

  /**
   * Camera API to interact with the viewer camera at a higher level.
   */
  camera: CameraApi

  isolation: IsolationApi

  settings: SettingsApi<UltraSettings>
  
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
