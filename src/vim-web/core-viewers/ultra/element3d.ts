import { IVimElement } from "../shared/vim";
import { VisibilityState } from "./visibility";
import { Vim } from "./vim";
import type { IUltraVim } from "./vim";
import * as THREE from "three";

/**
 * Public interface for an Ultra 3D element.
 * Provides visual state control (visibility, outline, color) and bounding box queries.
 *
 * **WebGL vs Ultra parity:** Ultra elements do NOT expose BIM data methods
 * (`getBimElement`, `getBimParameters`), geometry metadata (`hasMesh`, `isRoom`,
 * `elementId`, `instances`), or `getCenter()`. The Ultra viewer renders server-side,
 * so BIM data is not available on the client. For BIM queries, use the WebGL viewer.
 *
 * @example
 * ```ts
 * element.visible = false                          // Hide
 * element.outline = true                           // Highlight
 * element.ghosted = true                           // Ghosted appearance
 * element.color = new THREE.Color(0xff0000)        // Override color
 * const box = await element.getBoundingBox()       // Get bounding box
 * ```
 */
export interface IUltraElement3D extends IVimElement {
  /** The parent vim this element belongs to. */
  readonly vim: IUltraVim
  /** The BIM element index. */
  readonly element: number
  /** The handle of the parent vim on the server. */
  readonly vimHandle: number
  /** Whether the element is visible (not hidden). Preserves highlight state. */
  visible: boolean
  /** Whether the element has an outline highlight. Preserves visibility state. */
  outline: boolean
  /** Whether the element is rendered as a ghost. Preserves highlight state. */
  ghosted: boolean
  /** The display color override. Set to undefined to revert to default. */
  color: THREE.Color | undefined
  /** Retrieves the bounding box in Z-up world space (X = right, Y = forward, Z = up), or undefined if the element is abstract. */
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
   * Whether the element is rendered as a ghost. Preserves highlight state.
   */
  get ghosted(): boolean {
    const s = this.state;
    return s === VisibilityState.GHOSTED || s === VisibilityState.GHOSTED_HIGHLIGHTED;
  }
  set ghosted(value: boolean) {
    const highlighted = this.state >= 16;
    if (value) {
      this.state = highlighted ? VisibilityState.GHOSTED_HIGHLIGHTED : VisibilityState.GHOSTED;
    } else {
      this.state = highlighted ? VisibilityState.HIGHLIGHTED : VisibilityState.VISIBLE;
    }
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
