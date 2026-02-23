import { IVimElement } from "../shared/vim";
import { VisibilityState } from "./visibility";
import { Vim } from "./vim";
import type { IUltraVim } from "./vim";
import * as THREE from "three";

/**
 * Public interface for an Ultra 3D element.
 * Provides access to per-instance state, color, and bounding box.
 *
 * @example
 * element.visible = false           // Hide
 * element.outline = true            // Highlight
 * element.color = new THREE.Color(0xff0000)
 * element.state = VisibilityState.GHOSTED  // Advanced: ghosted appearance
 */
export interface IUltraElement3D extends IVimElement {
  /** The parent vim this element belongs to. */
  readonly vim: IUltraVim
  readonly element: number
  readonly vimHandle: number
  /** Low-level visibility state. For simple show/hide, use {@link visible} instead. */
  state: VisibilityState
  /** Whether the element is visible (not hidden). Preserves highlight state. */
  visible: boolean
  /** Whether the element has an outline highlight. Preserves visibility state. */
  outline: boolean
  color: THREE.Color | undefined
  getBoundingBox(): Promise<THREE.Box3 | undefined>
}

/**
 * @internal
 */
export class Element3D implements IUltraElement3D {
  /**
   * The parent `Vim` instance this element belongs to.
   */
  readonly vim: Vim;


  // TODO: this should be many instances
  // This will be replaced by the element index in the future
  /**
   * The internal instance index within the `Vim` model.
   */
  readonly element: number;

  /**
   * The unique handle of the parent `Vim` model.
   */
  get vimHandle() {
    return this.vim.handle;
  }

  /**
   * Creates a new `Element3D` instance.
   * @param vim - The parent `Vim` model.
   * @param element - The internal instance index.
   */
  constructor(vim: Vim, element: number) {
    this.vim = vim;
    this.element = element;
  }

  /**
   * Gets or sets the display state of the element (e.g., visible, hidden).
   */
  get state(): VisibilityState {
    return this.vim.visibility.getElementState(this.element);
  }
  set state(state: VisibilityState) {
    this.vim.visibility.setStateForElement(this.element, state);
  }

  /**
   * Whether the element is visible (not hidden). Preserves highlight state.
   */
  get visible(): boolean {
    const s = this.state;
    return s !== VisibilityState.HIDDEN && s !== VisibilityState.HIDDEN_HIGHLIGHTED;
  }
  set visible(value: boolean) {
    const highlighted = this.state >= 16;
    if (value) {
      this.state = highlighted ? VisibilityState.HIGHLIGHTED : VisibilityState.VISIBLE;
    } else {
      this.state = highlighted ? VisibilityState.HIDDEN_HIGHLIGHTED : VisibilityState.HIDDEN;
    }
  }

  /**
   * Whether the element has an outline highlight. Preserves visibility state.
   */
  get outline(): boolean {
    return this.state >= 16;
  }
  set outline(value: boolean) {
    const s = this.state;
    const baseState = s >= 16 ? s - 16 : s;
    this.state = value ? baseState + 16 : baseState;
  }

  /**
   * Gets or sets the color override of the element.
   */
  get color(): THREE.Color | undefined {
    return this.vim.getColor(this.element);
  }
  set color(color: THREE.Color | undefined) {
    this.vim.setColor([this.element], color);
  }

  /**
   * Computes and returns the bounding box of the element.
   * Returns undefined if the element is abstract.
   * @returns A promise resolving to the element's bounding box.
   */
  async getBoundingBox(): Promise<THREE.Box3 | undefined> {
    return this.vim.scene.getBoundingBoxForElements([this.element])
  }
}
