import { CoreModelObject } from "../../shared/coreVim";
import { Box3, RGBA32 } from "../../utils/math3d";
import { UltraVimNodeState } from "./ultraCoreNodeState";
import { UltraCoreVim } from "./ultraCoreVim";

export class UltraCoreModelObject implements CoreModelObject {
  readonly vim: UltraCoreVim;
  get vimHandle() {
    return this.vim.handle;
  }

  constructor(vim: UltraCoreVim, instance: number) {
    this.vim = vim;
    this.instance = instance;
  }
  readonly instance: number; // This should be many instances

  get state(): UltraVimNodeState {
    return this.vim.nodeState.getNodeState(this.instance);
  }
  set state(state: UltraVimNodeState) {
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