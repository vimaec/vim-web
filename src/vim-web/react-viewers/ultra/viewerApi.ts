import * as Core from '../../core-viewers';
import { ModalApi } from '../panels/modal';
import { CameraApi } from '../state/cameraState';
import { SectionBoxApi } from '../state/sectionBoxState';
import { IsolationApi } from '../state/sharedIsolation';
import { ControlBarApi } from '../controlbar/controlBar';
import { GenericPanelApi } from '../generic/genericPanel';
import { SettingsApi } from '../state/settingsApi';
import { UltraSettings } from './settings';
import { Container } from '../container';

export type UltraViewerApi = {
  /**
   * Discriminant to distinguish Ultra from WebGL viewer.
   */
  type: 'ultra'

  /**
   * HTML structure containing the viewer.
   */
  container: Container

  /**
   * The underlying Ultra core viewer. Provides direct access to the server connection,
   * camera, selection, raycaster, renderer, and section box.
   * Use for operations not exposed through the React API.
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
   * API to interact with the section box panel.
   */
  sectionBoxPanel : GenericPanelApi

  /**
   * Disposes of the viewer and its resources.
   */
  dispose: () => void;

  /**
   * Loads a VIM file via the Ultra server.
   * Wraps core.load() with connection management, progress UI (loading modal),
   * and error reporting. For headless loading, use core.load() directly.
   * @param url The URL of the file to load
   * @returns LoadRequest to track progress and get result
   */
  load(url: Core.Ultra.VimSource): Core.Ultra.IUltraLoadRequest;

  /**
   * Unloads a vim from the viewer and disposes it.
   * @param vim The vim to unload
   */
  unload(vim: Core.Ultra.IUltraVim): void;
};
