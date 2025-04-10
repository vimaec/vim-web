import { IVimObject } from "../shared/vim";
import { NodeState } from "./nodeState";
import { Box3, RGBA32 } from "./rpcTypes";
import { Vim } from "./vim";

export class Element3D implements IVimObject {
  readonly vim: Vim;
  get vimHandle() {
    return this.vim.handle;
  }

  constructor(vim: Vim, instance: number) {
    this.vim = vim;
    this.instance = instance;
  }
  readonly instance: number; // This should be many instances

  get state(): NodeState {
    return this.vim.nodeState.getNodeState(this.instance);
  }
  set state(state: NodeState) {
    this.vim.nodeState.setNodeState(this.instance, state);
  }

  get color(): RGBA32 | undefined {
    return this.vim.getColor(this.instance);
  }

  set color(color: RGBA32 | undefined) {
    this.vim.setColor([this.instance], color);
  }

  async getBoundingBox(): Promise<Box3> {
    return this.vim.getBoundingBoxNodes([this.instance]);
  }
}