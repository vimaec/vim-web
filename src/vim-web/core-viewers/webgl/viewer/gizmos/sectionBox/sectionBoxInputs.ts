/**
 * @module viw-webgl-viewer/gizmos/sectionBox
 */

import { Viewer } from '../../viewer';
import * as THREE from 'three';
import { SectionBoxHandles } from './sectionBoxHandles';
import { Axis, SectionBoxHandle } from './sectionBoxHandle';
import { threeNDCFromVector2 } from '../../raycaster';

const MIN_BOX_SIZE = 3;

/**
 * Manages pointer interactions (mouse, touch, etc.) on a {@link SectionBoxHandles} to
 * reshape a Three.js `Box3`. This includes detecting which handle is hovered or dragged,
 * capturing the pointer for smooth dragging, and enforcing a minimum box size.
 */
export class BoxInputs {
  // -------------------------------------------------------------------------
  // Dependencies and shared resources
  // -------------------------------------------------------------------------

  /** The parent Viewer controlling the scene. */
  private _viewer: Viewer;

  /** The handles mesh group containing the draggable cones/faces. */
  private _handles: SectionBoxHandles;

  /** The main box that is being reshaped by dragging handles. */
  private _sharedBox: THREE.Box3;

  // -------------------------------------------------------------------------
  // Internal state
  // -------------------------------------------------------------------------

  /** The currently hovered/dragged handle, if any. */
  private _handle: SectionBoxHandle | undefined;

  /** The origin point for dragging, updated on pointer down. */
  private _dragOrigin: THREE.Vector3 = new THREE.Vector3();

  /** The plane used for drag intersection (perpendicular to the camera direction). */
  private _dragPlane: THREE.Plane = new THREE.Plane();

  /** Whether a pointer is currently down on a handle. */
  private _mouseDown: boolean = false;

  /** A reusable Raycaster for picking and plane intersection. */
  private _raycaster: THREE.Raycaster = new THREE.Raycaster();

  /** The box state before the current drag. */
  private _lastBox: THREE.Box3 = new THREE.Box3();

  /** A callback to restore the original input listeners after unregistering. */
  private _restoreOriginalInputs: () => void;

  // -------------------------------------------------------------------------
  // Callbacks
  // -------------------------------------------------------------------------

  /**
   * Called when the pointer enters or leaves a handle face.
   * @param normal - The normal (forward) vector of the hovered handle, or a zero vector if none.
   */
  onFaceEnter: ((normal: THREE.Vector3) => void) | undefined;

  /**
   * Called continuously as the box is reshaped by dragging.
   * @param box - The updated box after the latest drag move.
   */
  onBoxStretch: ((box: THREE.Box3) => void) | undefined;

  /**
   * Called when the user has finished reshaping the box (pointer up).
   * @param box - The final box after dragging ends.
   */
  onBoxConfirm: ((box: THREE.Box3) => void) | undefined;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  /**
   * Creates a new BoxInputs instance for pointer-driven box resizing.
   * 
   * @param viewer - The parent {@link Viewer} that renders the scene.
   * @param handles - A {@link SectionBoxHandles} instance containing the draggable mesh handles.
   * @param box - The shared bounding box (`Box3`) that will be updated by dragging.
   */
  constructor(viewer: Viewer, handles: SectionBoxHandles, box: THREE.Box3) {
    this._viewer = viewer;
    this._handles = handles;
    this._sharedBox = box;
  }

  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------

  /**
   * Registers pointer event listeners on the viewer's canvas. 
   * If already registered, it does nothing.
   */
  public register(): void {
    if(this._restoreOriginalInputs) return; // Don't register twice

    const mouse = this._viewer.inputs.mouse;

    const up = mouse.onButtonUp
    const down = mouse.onButtonDown
    const move = mouse.onMouseMove
    const drag = mouse.onDrag

    this._restoreOriginalInputs = () => {
      mouse.onButtonUp = up
      mouse.onButtonDown = down
      mouse.onMouseMove = move
      mouse.onDrag = drag
    }

    mouse.onButtonUp = (pos, btn) => {
      up(pos, btn)
      this.onMouseUp(pos)
    }
    mouse.onButtonDown = (pos, btn) => {
      down(pos, btn)
      this.onMouseDown(pos)
    }

    mouse.onMouseMove = (pos) => {
      move(pos)
      this.onMouseMove(pos)
    }

    mouse.onDrag = (pos, btn) => {
      if(this._handle) return
      drag(pos, btn)
    }
  }

  /**
   * Unregisters any previously set pointer event listeners, releasing pointer capture
   * and resetting drag state.
   */
  public unregister(): void {
    this._mouseDown = false;
    this._handle?.highlight(false);
    this._handle = undefined;

    this._restoreOriginalInputs?.();
    this._restoreOriginalInputs = undefined
  }

  // -------------------------------------------------------------------------
  // Private Methods
  // -------------------------------------------------------------------------

  /**
   * Handles pointer movement events.
   * - If dragging, calls {@link onDrag}.
   * - Otherwise, performs a raycast to detect which handle is under the pointer.
   * 
   * @param event - The pointermove event.
   */
  private onMouseMove(position: THREE.Vector2): void {
    if (this._mouseDown) {
      this.onDrag(position);
      return;
    }

    const hits = this.raycast(position);
    const handle = hits?.[0]?.object?.userData?.handle;
    if (handle !== this._handle) {
      this._handle?.highlight(false);
      handle?.highlight(true);
      this._handle = handle;
      this.onFaceEnter?.(handle?.forward ?? new THREE.Vector3());
    }
  }

  /**
   * Handles pointer up events. Ends dragging and triggers {@link onBoxConfirm}.
   * 
   * @param event - The pointerup event.
   */
  private onMouseUp(position: THREE.Vector2): void {
    if(!this._mouseDown) return;
    this._mouseDown = false;

    //this._viewer.inputs.registerAll();
    // If mouse, update hover state one last time; if touch, clear handle.
    this.onMouseMove(position);

    this.onBoxConfirm?.(this._sharedBox);
  }

  /**
   * Handles pointer down events. Begins drag if a handle is hit, capturing the pointer.
   * 
   * @param event - The pointerdown event.
   */
  private onMouseDown(position: THREE.Vector2): void {
    const hits = this.raycast(position);
    const handle = hits?.[0]?.object?.userData?.handle;
    if (!handle) return;
    this._handle = handle;

    // Prepare for drag
    this._lastBox.copy(this._sharedBox);
    this._dragOrigin.copy(handle.position);
    const dist = handle.position.clone().dot(this._viewer.camera.forward);

    this._dragPlane.set(this._viewer.camera.forward, -dist);
    this._mouseDown = true;
    this.onFaceEnter?.(this._handle.forward.clone());
  }

  /**
   * Continues the drag operation. Determines the new position on the drag plane
   * and computes how far we moved along the handle's forward axis.
   * 
   * @param event - The pointermove event while dragging.
   */
  private onDrag(position: THREE.Vector2): void {
    if (!this._handle) return;

    // Intersection on the drag plane
    const point =
      this.raycastPlane(position) ??
      this._dragOrigin.clone();

    // Delta in plane space, projected along the handle forward
    const delta = point.sub(this._dragOrigin);  
    const amount = delta.dot(this._handle.forward);

    // Create an updated box with the stretch
    const box = this.stretch(this._handle.axis, this._handle.sign, amount);
    this.onBoxStretch?.(box);
  }

  /**
   * Expands or contracts the `_sharedBox` along one axis by a certain amount, 
   * ensuring the box cannot shrink below the minimum size (`MIN_BOX_SIZE`). 
   * 
   * @param axis - The axis ('x', 'y', or 'z') to stretch.
   * @param sign - +1 if stretching the 'max' side, -1 if stretching the 'min' side.
   * @param amount - The numeric offset along that axis to add or subtract.
   * @returns A **new** `Box3` instance with updated min/max coordinates.
   */
  private stretch(axis: Axis, sign: number, amount: number): THREE.Box3 {
    const box = this._sharedBox.clone();
    const direction = sign > 0 ? 'max' : 'min';
    const opposite = sign > 0 ? 'min' : 'max';

    // Where we want to move the side
    const target = this._lastBox[direction][axis] + (amount * sign);
    // The boundary to ensure min box size
    const minBoundary = this._lastBox[opposite][axis] + (MIN_BOX_SIZE * sign);

    // Apply the new side
    box[direction][axis] = target;

    // If the new side crosses the boundary, move the opposite side instead
    if (sign * (target - minBoundary) < 0) {
      box[opposite][axis] = target - (MIN_BOX_SIZE * sign);
    }

    return box;
  }

  /**
   * Raycasts into the handle meshes from the given pointer position.
   * 
   * @param position - The pointer position in canvas coordinates.
   * @returns An array of intersection results, if any.
   */
  private raycast(position: THREE.Vector2): THREE.Intersection[] {
    this.setupRaycaster(position);
    return this._raycaster.intersectObject(this._handles.meshes);
  }

  /**
   * Raycasts into the drag plane from the given pointer position.
   * 
   * @param position - The pointer position in canvas coordinates.
   * @returns The intersection point in 3D space, or `null` if none.
   */
  private raycastPlane(position: THREE.Vector2): THREE.Vector3 | null {
    this.setupRaycaster(position);
    return this._raycaster.ray.intersectPlane(
      this._dragPlane,
      new THREE.Vector3()
    );
  }

  private setupRaycaster(position: THREE.Vector2) {
    const pos = threeNDCFromVector2(position);
    this._raycaster.setFromCamera(pos, this._viewer.camera.three);
  }
}
