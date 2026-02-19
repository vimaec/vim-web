import { RefObject } from 'react';
import * as Core from '../../core-viewers';
import { ModalApi } from '../panels/modal';
import { CameraApi } from '../state/cameraState';
import { SectionBoxApi } from '../state/sectionBoxState';
import { IsolationApi } from '../state/sharedIsolation';
import { ControlBarApi } from '../controlbar/controlBar';
import { GenericPanelApi } from '../generic/genericPanel';
import { SettingsApi } from '../webgl/viewerApi';
import { UltraSettings } from './settings';

export type ViewerApi = {
  /**
   * Discriminant to distinguish Ultra from WebGL viewer.
   */
  type: 'ultra'

  /**
   * The Vim viewer instance associated with the viewer.
   */
  core: Core.Ultra.Viewer;

  /**
   * API to manage the modal dialog.
   */
  modal: ModalApi;

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
  isolationPanel : GenericPanelApi

  /**
   * API to interact with the isolation panel.
   */
  sectionBoxPanel : GenericPanelApi

  /**
   * Disposes of the viewer and its resources.
   */
  dispose: () => void;

  /**
   * Loads a file into the viewer.
   * @param url The URL of the file to load.
   */
  load(url: Core.Ultra.VimSource): Core.Ultra.ILoadRequest;
};
