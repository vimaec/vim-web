import type { SocketClient } from './socketClient'
import { Marshal, HitCheckResult, VimStatus } from './marshal'
import { Box3, RGBA, RGBA32, Segment, Vector2, Vector3 } from '../utils/math3d'

// RPC Generated Constants

export type MaterialHandle = 4294967295 | 6 | 2 | 0 | 1 | 3 | 4 | 5 | 7 | 8
export class MaterialHandles {
  static readonly Invalid: MaterialHandle = 4294967295
  static readonly Wireframe: MaterialHandle = 6
  static readonly FlatShaded: MaterialHandle = 2
  static readonly StandardOpaque: MaterialHandle = 0
  static readonly StandardGlass: MaterialHandle = 1
  static readonly GhostOutline: MaterialHandle = 3
  static readonly GhostFill: MaterialHandle = 4
  static readonly GhostBoth: MaterialHandle = 5
  static readonly Highlight: MaterialHandle = 7
  static readonly Invisible: MaterialHandle = 8
}

export const materialHandles : MaterialHandle[] = [
  MaterialHandles.Invalid,
  MaterialHandles.Wireframe,
  MaterialHandles.FlatShaded,
  MaterialHandles.StandardOpaque,
  MaterialHandles.StandardGlass,
  MaterialHandles.GhostOutline,
  MaterialHandles.GhostFill,
  MaterialHandles.GhostBoth,
  MaterialHandles.Highlight,
  MaterialHandles.Invisible
]

export class RpcClient {
  private readonly _messenger: SocketClient

  constructor (_messenger: SocketClient) {
    this._messenger = _messenger
  }
  // RPC Generated Code
  readonly API_VERSION = "4.0.0"

  RPCClearMaterialOverrides(componentHandle: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCClearMaterialOverrides");
    marshal.writeUInt(componentHandle);
    this._messenger.sendRPC(marshal);
  }

  RPCClearScene(): void {
    const marshal = new Marshal();
    marshal.writeString("RPCClearScene");
    this._messenger.sendRPC(marshal);
  }

  async RPCCreateMaterialInstances(materialHandle: number, smoothness: number, colors: RGBA32[]): Promise<number> {
    const marshal = new Marshal();
    marshal.writeString("RPCCreateMaterialInstances");
    marshal.writeUInt(materialHandle);
    marshal.writeUInt(smoothness);
    marshal.writeArrayOfRGBA32(colors);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readUInt(); 
    return ret;
  }

  async RPCCreateText(position: Vector3, color: RGBA32, text: string): Promise<number> {
    const marshal = new Marshal();
    marshal.writeString("RPCCreateText");
    marshal.writeVector3(position);
    marshal.writeRGBA32(color);
    marshal.writeString(text);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readUInt(); 
    return ret;
  }

  RPCDestroyMaterialInstances(materialInstanceHandle: number[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCDestroyMaterialInstances");
    marshal.writeArrayOfUInt(materialInstanceHandle);
    this._messenger.sendRPC(marshal);
  }

  RPCDestroyText(componentHandle: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCDestroyText");
    marshal.writeUInt(componentHandle);
    this._messenger.sendRPC(marshal);
  }

  RPCEnableSectionBox(enable: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCEnableSectionBox");
    marshal.writeBoolean(enable);
    this._messenger.sendRPC(marshal);
  }

  async RPCFrameAll(blendTime: number): Promise<Segment> {
    const marshal = new Marshal();
    marshal.writeString("RPCFrameAll");
    marshal.writeFloat(blendTime);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSegment(); 
    return ret;
  }

  async RPCFrameBox(box: Box3, blendTime: number): Promise<Segment> {
    const marshal = new Marshal();
    marshal.writeString("RPCFrameBox");
    marshal.writeBox3(box);
    marshal.writeFloat(blendTime);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSegment(); 
    return ret;
  }

  async RPCFrameInstances(componentHandle: number, nodes: number[], blendTime: number): Promise<Segment> {
    const marshal = new Marshal();
    marshal.writeString("RPCFrameInstances");
    marshal.writeUInt(componentHandle);
    marshal.writeArrayOfUInt(nodes);
    marshal.writeFloat(blendTime);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSegment(); 
    return ret;
  }

  async RPCFrameVim(componentHandle: number, blendTime: number): Promise<Segment> {
    const marshal = new Marshal();
    marshal.writeString("RPCFrameVim");
    marshal.writeUInt(componentHandle);
    marshal.writeFloat(blendTime);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSegment(); 
    return ret;
  }

  async RPCGetAPIVersion(): Promise<string> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetAPIVersion");
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readString(); 
    return ret;
  }

  async RPCGetBoundingBox(componentHandle: number, nodes: number[]): Promise<Box3> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetBoundingBox");
    marshal.writeUInt(componentHandle);
    marshal.writeArrayOfUInt(nodes);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readBox3(); 
    return ret;
  }

  async RPCGetCameraPosition(): Promise<Segment> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetCameraPosition");
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSegment(); 
    return ret;
  }

  async RPCGetLastError(): Promise<string> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetLastError");
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readString(); 
    return ret;
  }

  async RPCGetVimLoadingState(componentHandle: number): Promise<VimStatus> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetVimLoadingState");
    marshal.writeUInt(componentHandle);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readVimStatus(); 
    return ret;
  }

  RPCGhost(componentHandle: number, nodes: number[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCGhost");
    marshal.writeUInt(componentHandle);
    marshal.writeArrayOfUInt(nodes);
    this._messenger.sendRPC(marshal);
  }

  RPCGhostAll(componentHandle: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCGhostAll");
    marshal.writeUInt(componentHandle);
    this._messenger.sendRPC(marshal);
  }

  RPCHide(componentHandle: number, nodes: number[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCHide");
    marshal.writeUInt(componentHandle);
    marshal.writeArrayOfUInt(nodes);
    this._messenger.sendRPC(marshal);
  }

  RPCHideAABBs(componentHandle: number, nodes: number[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCHideAABBs");
    marshal.writeUInt(componentHandle);
    marshal.writeArrayOfUInt(nodes);
    this._messenger.sendRPC(marshal);
  }

  RPCHideAll(componentHandle: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCHideAll");
    marshal.writeUInt(componentHandle);
    this._messenger.sendRPC(marshal);
  }

  RPCHideAllAABBs(componentHandle: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCHideAllAABBs");
    marshal.writeUInt(componentHandle);
    this._messenger.sendRPC(marshal);
  }

  RPCHighlight(componentHandle: number, nodes: number[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCHighlight");
    marshal.writeUInt(componentHandle);
    marshal.writeArrayOfUInt(nodes);
    this._messenger.sendRPC(marshal);
  }

  RPCHighlightAll(componentHandle: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCHighlightAll");
    marshal.writeUInt(componentHandle);
    this._messenger.sendRPC(marshal);
  }

  RPCKeyEvent(keyCode: number, down: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCKeyEvent");
    marshal.writeInt(keyCode);
    marshal.writeBoolean(down);
    this._messenger.sendRPC(marshal);
  }

  async RPCLoadVim(fileName: string): Promise<number> {
    const marshal = new Marshal();
    marshal.writeString("RPCLoadVim");
    marshal.writeString(fileName);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readUInt(); 
    return ret;
  }

  async RPCLoadVimURL(url: string, authToken: string): Promise<number> {
    const marshal = new Marshal();
    marshal.writeString("RPCLoadVimURL");
    marshal.writeString(url);
    marshal.writeString(authToken);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readUInt(); 
    return ret;
  }

  RPCLockIblRotation(lock: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCLockIblRotation");
    marshal.writeBoolean(lock);
    this._messenger.sendRPC(marshal);
  }

  RPCMouseButtonEvent(mousePos: Vector2, mouseButton: number, down: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMouseButtonEvent");
    marshal.writeVector2(mousePos);
    marshal.writeInt(mouseButton);
    marshal.writeBoolean(down);
    this._messenger.sendRPC(marshal);
  }

  RPCMouseDoubleClickEvent(mousePos: Vector2, mouseButton: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMouseDoubleClickEvent");
    marshal.writeVector2(mousePos);
    marshal.writeInt(mouseButton);
    this._messenger.sendRPC(marshal);
  }

  RPCMouseMoveEvent(mousePos: Vector2): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMouseMoveEvent");
    marshal.writeVector2(mousePos);
    this._messenger.sendRPC(marshal);
  }

  RPCMouseScrollEvent(scrollValue: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMouseScrollEvent");
    marshal.writeInt(scrollValue);
    this._messenger.sendRPC(marshal);
  }

  RPCMouseSelectEvent(mousePos: Vector2, mouseButton: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMouseSelectEvent");
    marshal.writeVector2(mousePos);
    marshal.writeInt(mouseButton);
    this._messenger.sendRPC(marshal);
  }

  RPCMoveCameraTo(usePosition: boolean, useTarget: boolean, position: Vector3, target: Vector3, blendTime: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMoveCameraTo");
    marshal.writeBoolean(usePosition);
    marshal.writeBoolean(useTarget);
    marshal.writeVector3(position);
    marshal.writeVector3(target);
    marshal.writeFloat(blendTime);
    this._messenger.sendRPC(marshal);
  }

  RPCPauseRendering(pause: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCPauseRendering");
    marshal.writeBoolean(pause);
    this._messenger.sendRPC(marshal);
  }

  async RPCPerformHitTest(pos: Vector2): Promise<HitCheckResult> {
    const marshal = new Marshal();
    marshal.writeString("RPCPerformHitTest");
    marshal.writeVector2(pos);
    const returnMarshal = await this._messenger.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readHitCheckResult(); 
    return ret;
  }

  RPCSetAspectRatio(width: number, height: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetAspectRatio");
    marshal.writeUInt(width);
    marshal.writeUInt(height);
    this._messenger.sendRPC(marshal);
  }

  RPCSetCameraMode(orbit: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetCameraMode");
    marshal.writeBoolean(orbit);
    this._messenger.sendRPC(marshal);
  }

  RPCSetCameraPosition(state: Segment, blendTime: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetCameraPosition");
    marshal.writeSegment(state);
    marshal.writeFloat(blendTime);
    this._messenger.sendRPC(marshal);
  }

  RPCSetGhostColor(ghostColor: RGBA): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetGhostColor");
    marshal.writeRGBA(ghostColor);
    this._messenger.sendRPC(marshal);
  }

  RPCSetLighting(toneMappingWhitePoint: number, hdrScale: number, hdrBackgroundScale: number, hdrBackgroundSaturation: number, backgroundBlur: number, backgroundColor: RGBA): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetLighting");
    marshal.writeFloat(toneMappingWhitePoint);
    marshal.writeFloat(hdrScale);
    marshal.writeFloat(hdrBackgroundScale);
    marshal.writeFloat(hdrBackgroundSaturation);
    marshal.writeFloat(backgroundBlur);
    marshal.writeRGBA(backgroundColor);
    this._messenger.sendRPC(marshal);
  }

  RPCSetMaterialOverrides(componentHandle: number, nodes: number[], materialInstanceHandles: number[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetMaterialOverrides");
    marshal.writeUInt(componentHandle);
    marshal.writeArrayOfUInt(nodes);
    marshal.writeArrayOfUInt(materialInstanceHandles);
    this._messenger.sendRPC(marshal);
  }

  RPCSetMoveSpeed(speed: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetMoveSpeed");
    marshal.writeFloat(speed);
    this._messenger.sendRPC(marshal);
  }

  RPCSetSectionBox(aabb: Box3): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetSectionBox");
    marshal.writeBox3(aabb);
    this._messenger.sendRPC(marshal);
  }

  RPCShow(componentHandle: number, nodes: number[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCShow");
    marshal.writeUInt(componentHandle);
    marshal.writeArrayOfUInt(nodes);
    this._messenger.sendRPC(marshal);
  }

  RPCShowAABBs(componentHandle: number, nodes: number[], colors: RGBA32[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCShowAABBs");
    marshal.writeUInt(componentHandle);
    marshal.writeArrayOfUInt(nodes);
    marshal.writeArrayOfRGBA32(colors);
    this._messenger.sendRPC(marshal);
  }

  RPCShowAll(componentHandle: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCShowAll");
    marshal.writeUInt(componentHandle);
    this._messenger.sendRPC(marshal);
  }

  RPCStartScene(toneMappingWhitePoint: number, hdrScale: number, hdrBackgroundScale: number, hdrBackgroundSaturation: number, backgroundBlur: number, backgroundColor: RGBA): void {
    const marshal = new Marshal();
    marshal.writeString("RPCStartScene");
    marshal.writeFloat(toneMappingWhitePoint);
    marshal.writeFloat(hdrScale);
    marshal.writeFloat(hdrBackgroundScale);
    marshal.writeFloat(hdrBackgroundSaturation);
    marshal.writeFloat(backgroundBlur);
    marshal.writeRGBA(backgroundColor);
    this._messenger.sendRPC(marshal);
  }

  RPCTriggerRenderDocCapture(): void {
    const marshal = new Marshal();
    marshal.writeString("RPCTriggerRenderDocCapture");
    this._messenger.sendRPC(marshal);
  }

  RPCUnloadVim(componentHandle: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCUnloadVim");
    marshal.writeUInt(componentHandle);
    this._messenger.sendRPC(marshal);
  }
}