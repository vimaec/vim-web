import { Box3, RGBA } from "../../utils/math3d";
import { Validation } from "./validation";
import { ILogger } from "./logger";
import { defaultSceneSettings, RpcSafeClient, SceneSettings } from "./rpcSafeClient";
import { ClientStreamError } from "./socketClient";
import { ISignal, SignalDispatcher } from "ste-signals";

/**
 * Render settings that extend SceneSettings with additional rendering-specific properties
 */
export type RenderSettings = SceneSettings & {
  /** Whether to lock the Image-Based Lighting rotation */
  lockIblRotation: boolean
  /** Color used for ghost/transparent rendering */
  ghostColor: RGBA
}

/**
 * Default rendering settings
 */
export const defaultRenderSettings: RenderSettings = {
  ...defaultSceneSettings,
  lockIblRotation: true,
  ghostColor: new RGBA(14/255, 14/255, 14/255, 1/255)
}

/**
 * Interface defining the basic renderer capabilities
 */
export interface IRenderer {
  onSceneUpdated: ISignal
  ghostColor: RGBA
  lockIblRotation: boolean
  hdrScale: number
  toneMappingWhitePoint: number
  hdrBackgroundScale: number
  hdrBackgroundSaturation: number
  backgroundBlur: number
  backgroundColor: RGBA
  getBoundingBox(): Promise<Box3 | undefined>
}

/**
 * Renderer class that handles 3D scene rendering and settings management
 */
export class UltraCoreRenderer implements IRenderer {

  private _rpc: RpcSafeClient
  private _logger : ILogger
  private _settings: RenderSettings
  
  private _animationFrame: number | undefined = undefined;
  private _updateLighting: boolean = false;
  private _updateGhostColor: boolean = false;
  private _updateIblRotation: boolean = false;

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
    this._rpc.RPCSetGhostColor(this._settings.ghostColor)
    this._rpc.RPCLockIblRotation(this._settings.lockIblRotation)
  }

  notifySceneUpdated() {
    this._onSceneUpdated.dispatch()
  }

  // Getters

  /**
   * Gets the ghost color used for transparent rendering
   * @returns Current ghost color as RGBA
   */
  get ghostColor(): RGBA {
    return this._settings.ghostColor
  }

  /**
   * Gets the IBL rotation lock setting
   * @returns Whether IBL rotation is locked
   */
  get lockIblRotation(): boolean {
    return this._settings.lockIblRotation
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
    return this._settings.backGroundBlur;
  }

  /**
   * Gets the background color
   * @returns Current background color as RGBA
   */
  get backgroundColor(): RGBA {
    return this._settings.backgroundColor;
  }

  // Setters

  /**
   * Updates the ghost color used for transparent rendering
   * @param value - New ghost color as RGBA
   */
  set ghostColor(value: RGBA){
    value = Validation.clampRGBA01(value)
    if(this._settings.ghostColor.equals(value)) return
    this._settings.ghostColor = value
    this._updateGhostColor = true
    this.requestSettingsUpdate()
  }

  /**
   * Updates the IBL rotation lock setting
   * @param value - Whether to lock IBL rotation
   */
  set lockIblRotation(value: boolean){
    if(this._settings.lockIblRotation === value) return
    this._settings.lockIblRotation = value
    this._updateIblRotation = true
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
    if (this._settings.backGroundBlur === value) return;
    this._settings.backGroundBlur = value;
    this._updateLighting = true
    this.requestSettingsUpdate();
  }

  /**
   * Sets the background color
   * @param value - New background color as RGBA
   */
  set backgroundColor(value: RGBA) {
    value = Validation.clampRGBA01(value)
    if (this._settings.backgroundColor.equals(value)) return;
    this._settings.backgroundColor = value;
    this._updateLighting = true
    this.requestSettingsUpdate();
  }

  getBoundingBox(): Promise<Box3 | undefined> {
    return this._rpc.RPCGetSceneAABB()
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
    if(this._updateGhostColor) await this._rpc.RPCSetGhostColor(this._settings.ghostColor);
    if(this._updateIblRotation) await this._rpc.RPCLockIblRotation(this._settings.lockIblRotation);

    // Reset dirty flags
    this._updateLighting = false;
    this._updateGhostColor = false;
    this._updateIblRotation = false;
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