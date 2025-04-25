import { IVimElement } from "../shared/vim";
import { NodeState } from "./nodeState";
import { Box3, RGBA32 } from "./rpcTypes";
import { Vim } from "./vim";

/**
 * Represents a single 3D element within a `Vim` model.
 * Provides access to per-instance state, color, and bounding box.
 */
export class Element3D implements IVimElement {
  /**
   * The parent `Vim` instance this element belongs to.
   */
  readonly vim: Vim;


  // TODO: this should be many instances
  // This will be replaced by the element index in the future
  /**
   * The internal instance index within the `Vim` model.
   */
  readonly instance: number;

  /**
   * The unique handle of the parent `Vim` model.
   */
  get vimHandle() {
    return this.vim.handle;
  }

  /**
   * Creates a new `Element3D` instance.
   * @param vim - The parent `Vim` model.
   * @param instance - The internal instance index.
   */
  constructor(vim: Vim, instance: number) {
    this.vim = vim;
    this.instance = instance;
  }

  /**
   * Gets or sets the display state of the element (e.g., visible, hidden).
   */
  get state(): NodeState {
    return this.vim.nodeState.getNodeState(this.instance);
  }
  set state(state: NodeState) {
    this.vim.nodeState.setNodeState(this.instance, state);
  }

  /**
   * Gets or sets the color override of the element.
   */
  get color(): RGBA32 | undefined {
    return this.vim.getColor(this.instance);
  }
  set color(color: RGBA32 | undefined) {
    this.vim.setColor([this.instance], color);
  }

  /**
   * Computes and returns the bounding box of the element.
   * @returns A promise resolving to the element's bounding box.
   */
  async getBoundingBox(): Promise<Box3> {
    return this.vim.getBoundingBoxNodes([this.instance]);
  }
}
