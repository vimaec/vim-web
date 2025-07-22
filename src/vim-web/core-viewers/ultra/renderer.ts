import { ISignal, SignalDispatcher } from "ste-signals";
import * as THREE from "three";
import { Validation } from "../../utils";
import { ILogger } from "./logger";
import { defaultSceneSettings, RpcSafeClient, SceneSettings } from "./rpcSafeClient";
import { ClientStreamError } from "./socketClient";

import * as RpcUtils from "./rpcUtils";

/**
 * Render settings that extend SceneSettings with additional rendering-specific properties
 */
export type RenderSettings = SceneSettings & {
  /** Color used for ghost/transparent rendering */
  ghostColor: THREE.Color
  ghostOpacity: number
}

/**
 * Default rendering settings
 */
export const defaultRenderSettings: RenderSettings = {
  ...defaultSceneSettings,
  ghostColor: new THREE.Color(14/255, 14/255, 14/255),
  ghostOpacity: 64/255
}

/**
 * Interface defining the basic renderer capabilities
 */
export interface IRenderer {
  onSceneUpdated: ISignal
  ghostColor: THREE.Color
  ghostOpacity: number
  hdrScale: number
  toneMappingWhitePoint: number
  hdrBackgroundScale: number
  hdrBackgroundSaturation: number
  backgroundBlur: number
  backgroundColor: THREE.Color
  getBoundingBox(): Promise<THREE.Box3 | undefined>
}

/**
 * Renderer class that handles 3D scene rendering and settings management
 */
export class Renderer implements IRenderer {

  private _rpc: RpcSafeClient
  private _logger : ILogger
  private _settings: RenderSettings
  
  private _animationFrame: number | undefined = undefined;
  private _updateLighting: boolean = false;
  private _updateGhostColor: boolean = false;

  private readonly _onSceneUpdated = new SignalDispatcher()
  get onSceneUpdated() {
    return this._onSceneUpdated.asEvent()
  }

  /**
   * Creates a new Renderer instance
   * @param rpc - RPC client for communication with the rendering backend
   * @param settings - Optional partial render settings to override defaults
   */
  constructor(rpc: RpcSafeClient, logger: ILogger, settings: Partial<RenderSettings> = {}){
    this._rpc = rpc
    this._logger = logger
    this._settings = {...defaultRenderSettings, ...settings}
  }

  /**
   * Validates the connection to the server by attempting to start a scene.
   * @returns A promise that resolves to a ClientStreamError if the connection fails, or undefined if successful.
   */
  async validateConnection() : Promise<ClientStreamError | undefined>{
    const success = await this._rpc.RPCStartScene(this._settings)
    if(success) {
      this._logger.log('Scene stream started successfully')
      return undefined
    }

    const error = await this._rpc.RPCGetLastError()
    this._logger.error('Failed to start scene stream', error)
    return {
      status: 'error',
      error: 'stream',
      serverUrl: this._rpc.url,
      details: error
    }
  }

  /**
   * Initializes the renderer when connection is established
   * Sets up initial scene settings, ghost color, and IBL rotation
   */
  onConnect(){
    const color = RpcUtils.RGBAfromThree(this._settings.ghostColor, this._settings.ghostOpacity)
    this._rpc.RPCSetGhostColor(color)
  }

  notifySceneUpdated() {
    this._onSceneUpdated.dispatch()
  }

  // Getters

  /**
   * Gets the ghost color used for transparent rendering
   * @returns Current ghost color as a THREE.Color
   */
  get ghostColor(): THREE.Color {
    return this._settings.ghostColor
  }

  get ghostOpacity(): number {
    return this._settings.ghostOpacity
  }

  /**
   * Gets the tone mapping white point value
   * @returns Current tone mapping white point
   */
  get toneMappingWhitePoint(): number {
    return this._settings.toneMappingWhitePoint;
  }

  /**
   * Gets the HDR scale value
   * @returns Current HDR scale
   */
  get hdrScale(): number {
    return this._settings.hdrScale;
  }

  /**
   * Gets the HDR background scale value
   * @returns Current HDR background scale
   */
  get hdrBackgroundScale(): number {
    return this._settings.hdrBackgroundScale;
  }

  /**
   * Gets the HDR background saturation value
   * @returns Current HDR background saturation
   */
  get hdrBackgroundSaturation(): number {
    return this._settings.hdrBackgroundSaturation;
  }

  /**
   * Gets the background blur value
   * @returns Current background blur
   */
  get backgroundBlur(): number {
    return this._settings.backgroundBlur;
  }

  /**
   * Gets the background color
   * @returns Current background color as RGBA
   */
  get backgroundColor(): THREE.Color {
    return this._settings.backgroundColor.toThree();
  }

  // Setters

  /**
   * Updates the ghost color used for transparent rendering
   * @param value - New ghost color as THREE.Color
   */
  set ghostColor(value: THREE.Color)  {
    if(this._settings.ghostColor.equals(value)) return
    this._settings.ghostColor = value 
    this._updateGhostColor = true
    this.requestSettingsUpdate()
  }

  set ghostOpacity(value: number) {
    value = Validation.clamp01(value)
    if (this._settings.ghostOpacity === value) return
    this._settings.ghostOpacity = value
    this._updateGhostColor = true
    this.requestSettingsUpdate()
  }

  /**
   * Sets the tone mapping white point value
   * @param value - New tone mapping white point value
   */
  set toneMappingWhitePoint(value: number) {
    value = Validation.clamp01(value)
    if (this._settings.toneMappingWhitePoint === value) return;
    this._settings.toneMappingWhitePoint = value;
    this._updateLighting = true
    this.requestSettingsUpdate();
  }

  /**
   * Sets the HDR scale value
   * @param value - New HDR scale value
   */
  set hdrScale(value: number) {
    value = Validation.min0(value)
    if (this._settings.hdrScale === value) return;
    this._settings.hdrScale = value;
    this._updateLighting = true
    this.requestSettingsUpdate();
  }

  /**
   * Sets the HDR background scale value
   * @param value - New HDR background scale value
   */
  set hdrBackgroundScale(value: number) {
    value = Validation.clamp01(value)
    if (this._settings.hdrBackgroundScale === value) return;
    this._settings.hdrBackgroundScale = value;
    this._updateLighting = true
    this.requestSettingsUpdate();
  }

  /**
   * Sets the HDR background saturation value
   * @param value - New HDR background saturation value
   */
  set hdrBackgroundSaturation(value: number) {
    value = Validation.clamp01(value)
    if (this._settings.hdrBackgroundSaturation === value) return;
    this._settings.hdrBackgroundSaturation = value;
    this._updateLighting = true
    this.requestSettingsUpdate();
  }

  /**
   * Sets the background blur value
   * @param value - New background blur value
   */
  set backgroundBlur(value: number) {
    value = Validation.clamp01(value)
    if (this._settings.backgroundBlur === value) return;
    this._settings.backgroundBlur = value;
    this._updateLighting = true
    this.requestSettingsUpdate();
  }

  /**
   * Sets the background color
   * @param value - New background color as THREE.Color
   */
  set backgroundColor(value: THREE.Color) {
    const color = RpcUtils.RGBAfromThree(value, 1);
    if (this._settings.backgroundColor.equals(color)) return;
    this._settings.backgroundColor = color;
    this._updateLighting = true
    this.requestSettingsUpdate();
  }

  getBoundingBox(): Promise<THREE.Box3 | undefined> {
    return this._rpc.RPCGetAABBForScene()
  }

  /**
   * Requests an update to be performed on the next animation frame.
   * Multiple setting changes will be batched into a single update.
   * @private
   */
  private requestSettingsUpdate() {
    if(this._animationFrame) return
    this._animationFrame = requestAnimationFrame(() => {
      this.applySettings()
    });
  }

  private async applySettings(){
    if(this._updateLighting) await this._rpc.RPCSetLighting(this._settings);
    if(this._updateGhostColor){
      const color = RpcUtils.RGBAfromThree(this._settings.ghostColor, this._settings.ghostOpacity)
      await this._rpc.RPCSetGhostColor(color);
    }

    // Reset dirty flags
    this._updateLighting = false;
    this._updateGhostColor = false;
    this._animationFrame = undefined;
  }

  /**
   * Cleans up renderer resources
   * Cancels any pending animation frames
   */
  dispose(){
    if(this._animationFrame){
      cancelAnimationFrame(this._animationFrame)
      this._animationFrame = undefined
    }
  }
}