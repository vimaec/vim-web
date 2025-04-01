/**
 * @module viw-webgl-viewer/gizmos/sectionBox
 */

import { WebglCoreViewer } from '../../webglCoreViewer';
import * as THREE from 'three';
import { BoxInputs } from './sectionBoxInputs';
import { SignalDispatcher } from 'ste-signals';
import { SimpleEventDispatcher } from 'ste-simple-events';
import { SectionBoxGizmo } from './sectionBoxGizmo';
import { safeBox } from '../../../../utils/threeUtils';

/**
 * Manages a section box gizmo, serving as a proxy between the renderer and the user.
 * 
 * This class:
 *  - Maintains a Three.js `Box3` that defines the clipping region.
 *  - Handles user interaction via {@link BoxInputs}.
 *  - Updates a {@link SectionBoxGizmo} to visualize the clipping box.
 *  - Dispatches signals when the box is resized or interaction state changes.
 */
export class SectionBox {
  // -------------------------------------------------------------------------
  // Private fields
  // -------------------------------------------------------------------------

  private _viewer: WebglCoreViewer;
  private _gizmos: SectionBoxGizmo;
  private _inputs: BoxInputs;
  
  private _clip: boolean | undefined = undefined;
  private _visible: boolean | undefined = undefined;
  private _interactive: boolean | undefined = undefined;

  private _onStateChanged = new SignalDispatcher();
  private _onBoxConfirm = new SimpleEventDispatcher<THREE.Box3>();
  private _onHover = new SimpleEventDispatcher<boolean>();

  /**
   * @internal
   * A convenience getter to the viewer's renderer.
   */
  private get renderer() {
    return this._viewer.renderer;
  }

  /**
   * @internal
   * A convenience getter to the `Section` module in the renderer.
   */
  private get section() {
    return this._viewer.renderer.section;
  }

  // -------------------------------------------------------------------------
  // Public Signals
  // -------------------------------------------------------------------------

  /**
   * Dispatches when any of the following properties change:
   * - {@link clip} (clipping planes active)
   * - {@link visible} (gizmo visibility)
   * - {@link interactive} (pointer inputs active)
   */
  get onStateChanged() {
    return this._onStateChanged.asEvent();
  }

  /**
   * Dispatches when the user finishes manipulating (dragging) the box.
   * The payload is the final {@link THREE.Box3} used for clipping.
   */
  get onBoxConfirm() {
    return this._onBoxConfirm.asEvent();
  }

  /**
   * Dispatches a boolean indicating pointer hover state on the box handles:
   *  - `true` if the pointer has entered a handle
   *  - `false` if it has left or no handle is hovered
   */
  get onHover() {
    return this._onHover.asEvent();
  }

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  /**
   * Creates a new SectionBox gizmo controller.
   * 
   * @param viewer - The parent {@link WebglCoreViewer} in which the section box is rendered.
   */
  constructor(viewer: WebglCoreViewer) {
    this._viewer = viewer;

    this._gizmos = new SectionBoxGizmo(viewer.renderer, viewer.camera);
    this._inputs = new BoxInputs(
      viewer,
      this._gizmos.handles,
      this._viewer.renderer.section.box
    );

    // When the pointer enters/leaves a face, dispatch hover state.
    this._inputs.onFaceEnter = (normal) => {
      this._onHover.dispatch(normal.x !== 0 || normal.y !== 0 || normal.z !== 0);
      this.renderer.needsUpdate = true;
    };

    // When user drags the box, resize and update.
    this._inputs.onBoxStretch = (box) => {
      this.renderer.section.fitBox(box);
      this.update();
    };

    // When drag ends, dispatch the final box.
    this._inputs.onBoxConfirm = (box) => this._onBoxConfirm.dispatch(box);

    // Default states
    this.clip = false;
    this.visible = false;
    this.interactive = false;
    this.update();
  }

  // -------------------------------------------------------------------------
  // Public Properties
  // -------------------------------------------------------------------------

  /**
   * Returns a copy of the current section box.
   * To programmatically update the box, see {@link setBox}.
   */
  getBox(): THREE.Box3 {
    return this.section.box?.clone();
  }

  /**
   * Determines whether the section gizmo applies clipping planes to the model.
   * 
   * When `true`, `renderer.section.active` is enabled.
   */
  get clip(): boolean {
    return this._clip ?? false;
  }

  set clip(value: boolean) {
    if (value === this._clip) return;
    this._clip = value;
    this.renderer.section.active = value;
    this._onStateChanged.dispatch();
  }

  /**
   * Determines whether the gizmo is interactive (i.e. responds to pointer events).
   * 
   * When `true`, pointer events are registered and box handles can be dragged.
   */
  get interactive(): boolean {
    return this._interactive ?? false;
  }

  set interactive(value: boolean) {
    if (value === this._interactive) return;

    if (!this._interactive && value) {
      this._inputs.register();
    }
    if (this._interactive && !value) {
      this._inputs.unregister();
    }

    this._interactive = value;
    this.renderer.needsUpdate = true;
    this._onStateChanged.dispatch();
  }

  /**
   * Determines whether the section box gizmo is visible in the scene.
   */
  get visible(): boolean {
    return this._visible ?? false;
  }

  set visible(value: boolean) {
    if (value === this._visible) return;
    this._gizmos.visible = value;
    this._visible = value;
    if (value) {
      this.update();
    }
    this.renderer.needsUpdate = true;
    this._onStateChanged.dispatch();
  }

  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------

  /**
   * Resizes the section gizmo to match the given box, optionally expanded by a padding.
   * After resizing, this method also updates the renderer's clipping box.
   * 
   * @param box - The bounding box to match (required).
   * @param padding - The scalar amount by which to expand the bounding box. Default is `1`.
   */
  public setBox(box: THREE.Box3): void {
    if (!box) return;
    box = safeBox(box);
    
    this._gizmos.fitBox(box);
    this.renderer.section.fitBox(box);
    this._onBoxConfirm.dispatch(box);
    this.renderer.needsUpdate = true;
  }

  /**
   * Updates the section box to match the current size of `this.section.box`.
   * 
   * Call this if the renderer's section box is changed by code outside this class.
   */
  public update(): void {
    this.setBox(this.section.box);
    this.renderer.needsUpdate = true;
  }

  /**
   * Disposes of the gizmo and input event listeners, cleaning up related resources.
   * 
   * After disposal, this `SectionBox` instance should no longer be used.
   */
  public dispose(): void {
    this._onBoxConfirm.clear();
    this._onHover.clear();
    this._gizmos.dispose();
    this._inputs.unregister();
  }
}
