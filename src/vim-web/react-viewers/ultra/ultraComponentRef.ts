import * as Ultra from '../../core-viewers/ultra';
import { ModalRef } from '../panels/modal';
import { SectionBoxRef } from '../state/sectionBoxState';

// TODO: Don't depend on the webgl component
import {ControlBarRef} from '../webgl/webglComponentRef'


export type UltraComponentRef = {
  /**
   * The Vim viewer instance associated with the component.
   */
  viewer: Ultra.Viewer;

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
   * Disposes of the component and its resources.
   */
  dispose: () => void;

  /**
   * Loads a file into the viewer.
   * @param url The URL of the file to load.
   */
  load(url: Ultra.VimSource): Ultra.ILoadRequest;
};
