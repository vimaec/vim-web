import type{SocketClient} from './socketClient'
import { Marshal } from './rpcMarshal'
import * as RpcTypes from './rpcTypes'

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

export type VisibilityState = 0 | 1 | 2 | 3 | 16;
export class VisibilityStates {
  static readonly Visible: VisibilityState = 0;
  static readonly Hidden: VisibilityState = 1;
  static readonly Ghosted: VisibilityState = 2;
  static readonly Highlighted: VisibilityState = 16;
};

export type RenderingMode = 0 | 1;
export class RenderingModes {
  static readonly Standard: RenderingMode = 0;
  static readonly FlatShaded: RenderingMode = 1;
};

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
  private readonly _socket: SocketClient

get connected() : boolean{
return this._socket.state.status === "connected"
}

  get url(): string {
    return this._socket.url
  }

  constructor (_socket: SocketClient) {
    this._socket = _socket
  }
  // RPC Generated Code
  readonly API_VERSION = "6.0.0"

  RPCClearMaterialOverrides(): void {
    const marshal = new Marshal();
    marshal.writeString("RPCClearMaterialOverrides");
    this._socket.sendRPC(marshal);
  }

  async RPCCreateMaterialInstances(materialHandle: number, smoothness: number, colors: RpcTypes.RGBA32[]): Promise<number> {
    const marshal = new Marshal();
    marshal.writeString("RPCCreateMaterialInstances");
    marshal.writeUInt(materialHandle);
    marshal.writeUInt(smoothness);
    marshal.writeArrayOfRGBA32(colors);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readUInt(); 
    return ret;
  }

  async RPCCreateText(position: RpcTypes.Vector3, color: RpcTypes.RGBA32, text: string): Promise<number> {
    const marshal = new Marshal();
    marshal.writeString("RPCCreateText");
    marshal.writeVector3(position);
    marshal.writeRGBA32(color);
    marshal.writeString(text);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readUInt(); 
    return ret;
  }

  RPCDestroyMaterialInstances(materialInstanceHandles: number[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCDestroyMaterialInstances");
    marshal.writeArrayOfUInt(materialInstanceHandles);
    this._socket.sendRPC(marshal);
  }

  RPCDestroyText(componentHandle: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCDestroyText");
    marshal.writeUInt(componentHandle);
    this._socket.sendRPC(marshal);
  }

  RPCEnableSectionBox(value: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCEnableSectionBox");
    marshal.writeBoolean(value);
    this._socket.sendRPC(marshal);
  }

  async RPCFrameAABB(box: RpcTypes.Box3, blendTime: number): Promise<RpcTypes.Segment> {
    const marshal = new Marshal();
    marshal.writeString("RPCFrameAABB");
    marshal.writeBox3(box);
    marshal.writeFloat(blendTime);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSegment(); 
    return ret;
  }

  async RPCFrameElements(vimIndex: number, elementIndices: number[], blendTime: number): Promise<RpcTypes.Segment> {
    const marshal = new Marshal();
    marshal.writeString("RPCFrameElements");
    marshal.writeUInt(vimIndex);
    marshal.writeArrayOfUInt(elementIndices);
    marshal.writeFloat(blendTime);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSegment(); 
    return ret;
  }

  async RPCFrameScene(blendTime: number): Promise<RpcTypes.Segment> {
    const marshal = new Marshal();
    marshal.writeString("RPCFrameScene");
    marshal.writeFloat(blendTime);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSegment(); 
    return ret;
  }

  async RPCFrameVim(vimIndex: number, blendTime: number): Promise<RpcTypes.Segment> {
    const marshal = new Marshal();
    marshal.writeString("RPCFrameVim");
    marshal.writeUInt(vimIndex);
    marshal.writeFloat(blendTime);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSegment(); 
    return ret;
  }

  async RPCGetAABBForElements(vimIndex: number, elementIndices: number[]): Promise<RpcTypes.Box3> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetAABBForElements");
    marshal.writeUInt(vimIndex);
    marshal.writeArrayOfUInt(elementIndices);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readBox3(); 
    return ret;
  }

  async RPCGetAABBForScene(): Promise<RpcTypes.Box3> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetAABBForScene");
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readBox3(); 
    return ret;
  }

  async RPCGetAABBForVim(vimIndex: number): Promise<RpcTypes.Box3> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetAABBForVim");
    marshal.writeUInt(vimIndex);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readBox3(); 
    return ret;
  }

  async RPCGetAPIVersion(): Promise<string> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetAPIVersion");
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readString(); 
    return ret;
  }

  async RPCGetCameraView(): Promise<RpcTypes.Segment> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetCameraView");
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSegment(); 
    return ret;
  }

  async RPCGetElementCountForScene(): Promise<number> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetElementCountForScene");
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readUInt(); 
    return ret;
  }

  async RPCGetElementCountForVim(vimIndex: number): Promise<number> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetElementCountForVim");
    marshal.writeUInt(vimIndex);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readUInt(); 
    return ret;
  }

  async RPCGetElementIds(vimIndex: number): Promise<bigint[]> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetElementIds");
    marshal.writeUInt(vimIndex);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readArrayOfUInt64(); 
    return ret;
  }

  async RPCGetLastError(): Promise<string> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetLastError");
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readString(); 
    return ret;
  }

  async RPCGetRoomElements(vimIndex: number): Promise<number[]> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetRoomElements");
    marshal.writeUInt(vimIndex);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readArrayOfUInt(); 
    return ret;
  }

  async RPCGetSectionBox(): Promise<RpcTypes.SectionBoxState> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetSectionBox");
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readSectionBoxState(); 
    return ret;
  }

  async RPCGetVimLoadingState(vimIndex: number): Promise<RpcTypes.VimStatus> {
    const marshal = new Marshal();
    marshal.writeString("RPCGetVimLoadingState");
    marshal.writeUInt(vimIndex);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readVimStatus(); 
    return ret;
  }

  RPCKeyEvent(keyCode: number, down: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCKeyEvent");
    marshal.writeInt(keyCode);
    marshal.writeBoolean(down);
    this._socket.sendRPC(marshal);
  }

  async RPCLoadVim(fileName: string): Promise<number> {
    const marshal = new Marshal();
    marshal.writeString("RPCLoadVim");
    marshal.writeString(fileName);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readUInt(); 
    return ret;
  }

  async RPCLoadVimURL(url: string, authToken: string): Promise<number> {
    const marshal = new Marshal();
    marshal.writeString("RPCLoadVimURL");
    marshal.writeString(url);
    marshal.writeString(authToken);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readUInt(); 
    return ret;
  }

  RPCMouseButtonEvent(mousePos: RpcTypes.Vector2, mouseButton: number, down: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMouseButtonEvent");
    marshal.writeVector2(mousePos);
    marshal.writeInt(mouseButton);
    marshal.writeBoolean(down);
    this._socket.sendRPC(marshal);
  }

  RPCMouseDoubleClickEvent(mousePos: RpcTypes.Vector2, mouseButton: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMouseDoubleClickEvent");
    marshal.writeVector2(mousePos);
    marshal.writeInt(mouseButton);
    this._socket.sendRPC(marshal);
  }

  RPCMouseMoveEvent(mousePos: RpcTypes.Vector2): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMouseMoveEvent");
    marshal.writeVector2(mousePos);
    this._socket.sendRPC(marshal);
  }

  RPCMouseScrollEvent(scrollValue: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMouseScrollEvent");
    marshal.writeInt(scrollValue);
    this._socket.sendRPC(marshal);
  }

  RPCMouseSelectEvent(mousePos: RpcTypes.Vector2, mouseButton: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCMouseSelectEvent");
    marshal.writeVector2(mousePos);
    marshal.writeInt(mouseButton);
    this._socket.sendRPC(marshal);
  }

  RPCPauseRendering(pause: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCPauseRendering");
    marshal.writeBoolean(pause);
    this._socket.sendRPC(marshal);
  }

  async RPCPerformHitTest(pos: RpcTypes.Vector2): Promise<RpcTypes.HitCheckResult> {
    const marshal = new Marshal();
    marshal.writeString("RPCPerformHitTest");
    marshal.writeVector2(pos);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readHitCheckResult(); 
    return ret;
  }

  RPCSetCameraAspectRatio(width: number, height: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetCameraAspectRatio");
    marshal.writeUInt(width);
    marshal.writeUInt(height);
    this._socket.sendRPC(marshal);
  }

  RPCSetCameraMode(orbit: boolean): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetCameraMode");
    marshal.writeBoolean(orbit);
    this._socket.sendRPC(marshal);
  }

  RPCSetCameraPosition(position: RpcTypes.Vector3, blendTime: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetCameraPosition");
    marshal.writeVector3(position);
    marshal.writeFloat(blendTime);
    this._socket.sendRPC(marshal);
  }

  RPCSetCameraSpeed(speed: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetCameraSpeed");
    marshal.writeFloat(speed);
    this._socket.sendRPC(marshal);
  }

  RPCSetCameraTarget(target: RpcTypes.Vector3, blendTime: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetCameraTarget");
    marshal.writeVector3(target);
    marshal.writeFloat(blendTime);
    this._socket.sendRPC(marshal);
  }

  RPCSetCameraView(state: RpcTypes.Segment, blendTime: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetCameraView");
    marshal.writeSegment(state);
    marshal.writeFloat(blendTime);
    this._socket.sendRPC(marshal);
  }

  RPCSetGhostColor(ghostColor: RpcTypes.RGBA): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetGhostColor");
    marshal.writeRGBA(ghostColor);
    this._socket.sendRPC(marshal);
  }

  RPCSetLighting(toneMappingWhitePoint: number, hdrScale: number, hdrBackgroundScale: number, hdrBackgroundSaturation: number, backgroundBlur: number, backgroundColor: RpcTypes.RGBA): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetLighting");
    marshal.writeFloat(toneMappingWhitePoint);
    marshal.writeFloat(hdrScale);
    marshal.writeFloat(hdrBackgroundScale);
    marshal.writeFloat(hdrBackgroundSaturation);
    marshal.writeFloat(backgroundBlur);
    marshal.writeRGBA(backgroundColor);
    this._socket.sendRPC(marshal);
  }

  RPCSetMaterialOverridesForElements(vimIndex: number, elementIndices: number[], materialInstanceHandles: number[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetMaterialOverridesForElements");
    marshal.writeUInt(vimIndex);
    marshal.writeArrayOfUInt(elementIndices);
    marshal.writeArrayOfUInt(materialInstanceHandles);
    this._socket.sendRPC(marshal);
  }

  RPCSetSectionBox(state: RpcTypes.SectionBoxState): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetSectionBox");
    marshal.writeSectionBoxState(state);
    this._socket.sendRPC(marshal);
  }

  RPCSetStateElements(vimIndex: number, elementIndices: number[], state: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetStateElements");
    marshal.writeUInt(vimIndex);
    marshal.writeArrayOfUInt(elementIndices);
    marshal.writeUInt(state);
    this._socket.sendRPC(marshal);
  }

  RPCSetStateScene(state: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetStateScene");
    marshal.writeUInt(state);
    this._socket.sendRPC(marshal);
  }

  RPCSetStateVim(vimIndex: number, state: number): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetStateVim");
    marshal.writeUInt(vimIndex);
    marshal.writeUInt(state);
    this._socket.sendRPC(marshal);
  }

  RPCSetStatesElements(vimIndex: number, elementIndices: number[], states: number[]): void {
    const marshal = new Marshal();
    marshal.writeString("RPCSetStatesElements");
    marshal.writeUInt(vimIndex);
    marshal.writeArrayOfUInt(elementIndices);
    marshal.writeArrayOfUInt(states);
    this._socket.sendRPC(marshal);
  }

  async RPCStartScene(toneMappingWhitePoint: number, hdrScale: number, hdrBackgroundScale: number, hdrBackgroundSaturation: number, backgroundBlur: number, backgroundColor: RpcTypes.RGBA): Promise<boolean> {
    const marshal = new Marshal();
    marshal.writeString("RPCStartScene");
    marshal.writeFloat(toneMappingWhitePoint);
    marshal.writeFloat(hdrScale);
    marshal.writeFloat(hdrBackgroundScale);
    marshal.writeFloat(hdrBackgroundSaturation);
    marshal.writeFloat(backgroundBlur);
    marshal.writeRGBA(backgroundColor);
    const returnMarshal = await this._socket.sendRPCWithReturn(marshal);
    const ret = returnMarshal.readBoolean(); 
    return ret;
  }

  RPCTriggerRenderDocCapture(): void {
    const marshal = new Marshal();
    marshal.writeString("RPCTriggerRenderDocCapture");
    this._socket.sendRPC(marshal);
  }

  RPCUnloadAll(): void {
    const marshal = new Marshal();
    marshal.writeString("RPCUnloadAll");
    this._socket.sendRPC(marshal);
  }

}
