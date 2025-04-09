import * as Core from '../../core-viewers/ultra';
import { ModalRef } from '../panels/modal';
import { CameraRef } from '../state/cameraState';
import { SectionBoxRef } from '../state/sectionBoxState';
import { IsolationRef } from '../state/sharedIsolation';

// TODO: Don't depend on the webgl component
import {ControlBarRef} from '../webgl/viewerRef'


export type ViewerRef = {
  /**
   * The Vim viewer instance associated with the component.
   */
  viewer:Core.Viewer;

  /**
   * API to manage the modal dialog.
   */
  modal: ModalRef;

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

  /**
   * Disposes of the component and its resources.
   */
  dispose: () => void;

  /**
   * Loads a file into the viewer.
   * @param url The URL of the file to load.
   */
  load(url: Core.VimSource): Core.ILoadRequest;
};
