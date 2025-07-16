import * as RpcTypes from "./rpcTypes"
import { MaterialHandle, RpcClient } from "./rpcClient"
import { Validation } from "../../utils";
import { batchArray, batchArrays } from "../../utils/array"
import { INVALID_HANDLE } from "./viewer"
import { VisibilityState } from "./visibility";
/**
 * Default maximum number of items to include in a single RPC batch operation.
 */
const defaultBatchSize = 10000

/**
 * Describes the source location and optional authentication for loading a VIM file.
 */
export type VimSource = {
  /**
   * URL to the VIM file.
   * Can be a local path (file://) or remote URL (http:// or https://).
   */
  url: string;

  /**
   * Optional authentication token for accessing protected resources.
   */
  authToken?: string;
}

/**
 * Represents the loading state and progress for a single vim.
 */
export type VimLoadingState = {
  /**
   * Current loading status.
   */
  status: VimLoadingStatus;

  /**
   * Loading progress as a percentage from 0 to 100.
   */
  progress: number;
}

/**
 * Defines supported input modes for camera control in the viewer.
 */
export enum InputMode {
  /**
   * Orbit mode — rotates around a fixed point.
   */
  Orbit = 'orbit',

  /**
   * Free mode — allows unrestricted movement.
   */
  Free = 'free'
}

/**
 * Scene-wide rendering and lighting configuration options.
 */
export type SceneSettings = {
  /**
   * White point for tone mapping (clamped between 0 and 1).
   */
  toneMappingWhitePoint: number;

  /**
   * Global HDR intensity multiplier (floored to 0).
   */
  hdrScale: number;

  /**
   * HDR scale for the background (clamped between 0 and 1).
   */
  hdrBackgroundScale: number;

  /**
   * Background saturation (clamped between 0 and 1).
   */
  hdrBackgroundSaturation: number;

  /**
   * Background blur strength (clamped between 0 and 1).
   */
  backgroundBlur: number;

  /**
   * Background color in linear RGBA format.
   */
  backgroundColor: RpcTypes.RGBA;
}

/**
 * Default scene settings used when none are explicitly provided.
 */
export const defaultSceneSettings: SceneSettings = {
  toneMappingWhitePoint: 0.1009,
  hdrScale: 1.37,
  hdrBackgroundScale: 1.0,
  hdrBackgroundSaturation: 1.0,
  backgroundBlur: 1.0,
  backgroundColor: new RpcTypes.RGBA(0.9, 0.9, 0.9, 1.0)
}

/**
 * Enumerates the possible states of VIM file loading.
 */
export enum VimLoadingStatus {
  /**
   * No known loading activity.
   */
  Unknown = 0,

  /**
   * Actively loading VIM data.
   */
  Loading = 1,

  /**
   * Downloading VIM file from a remote source.
   */
  Downloading = 2,

  /**
   * Load completed successfully.
   */
  Done = 3,

  /**
   * Download failed (e.g., due to network or permission issues).
   */
  FailedToDownload = 4,

  /**
   * VIM file could not be parsed or initialized correctly.
   */
  FailedToLoad = 5
}
/**
 * Provides safe, validated methods to interact with the RpcClient.
 * This class wraps low-level RPC calls with input validation, error handling,
 * and batching support to ensure robustness and performance when dealing with large data.
 */
export class RpcSafeClient {
  private readonly rpc: RpcClient
  private readonly batchSize: number

  /**
   * The URL used by the underlying RPC connection.
   */
  get url(): string {
    return this.rpc.url
  }

  /**
   * Indicates whether the RPC client is currently connected.
   */
  get connected(): boolean {
    return this.rpc.connected
  }

  /**
   * Creates a new RpcSafeClient instance.
   * @param rpc - The underlying RpcClient used for communication
   * @param batchSize - Maximum size of batched data for operations (default: 10000)
   */
  constructor(rpc: RpcClient, batchSize: number = defaultBatchSize) {
    this.rpc = rpc
    this.batchSize = batchSize
  }

  /*******************************************************************************
   * SCENE MANAGEMENT METHODS
   * Methods for managing the overall scene, including initialization, lighting,
   * and scene-wide settings.
   ******************************************************************************/

  /**
   * Initializes and starts the scene with the given settings.
   * @param settings - Optional partial scene settings to override defaults
   * @returns Promise resolving to true if the scene started successfully, false otherwise
   * @remarks Missing values will be filled from {@link defaultSceneSettings}
   */
  async RPCStartScene(settings?: Partial<SceneSettings>): Promise<boolean> {
    const s = { ...defaultSceneSettings, ...(settings ?? {}) }

    return await this.safeCall( 
      () => this.rpc.RPCStartScene(
        Validation.clamp01(s.toneMappingWhitePoint),
        Validation.min0(s.hdrScale),
        Validation.clamp01(s.hdrBackgroundScale),
        Validation.clamp01(s.hdrBackgroundSaturation),
        Validation.clamp01(s.backgroundBlur),
        Validation.clampRGBA01(s.backgroundColor)
      ),
      false
    )
  }

  /**
   * Updates the scene’s lighting configuration.
   * @param settings - The complete lighting and background settings to apply
   */
  RPCSetLighting(settings: SceneSettings): void {
    const s = settings
    this.rpc.RPCSetLighting(
      Validation.clamp01(s.toneMappingWhitePoint),
      Validation.min0(s.hdrScale),
      Validation.clamp01(s.hdrBackgroundScale),
      Validation.clamp01(s.hdrBackgroundSaturation),
      Validation.clamp01(s.backgroundBlur),
      Validation.clampRGBA01(s.backgroundColor)
    )
  }

  /**
   * Retrieves the total number of elements across the entire scene.
   * @returns Promise resolving to the total number of elements (0 on failure).
   */
  RPCGetElementCountForScene(): Promise<number> {
    return this.safeCall(
      () => this.rpc.RPCGetElementCountForScene(), 0)
  }

  /**
   * Retrieves the number of elements within a specific loaded vim.
   * @param vimIndex - Index of the loaded vim to query
   * @returns Promise resolving to the element count (0 on failure)
   */
  RPCGetElementCountForVim(vimIndex: number): Promise<number> {
    return this.safeCall(
      () => this.rpc.RPCGetElementCountForVim(vimIndex), 0)
  }

  /*******************************************************************************
   * ELEMENTS VISIBILITY METHODS
   * Methods for controlling element visibility, including show/hide, ghosting,
   * and highlighting functionality.
   ******************************************************************************/
  /**
   * Sets a single visibility state for given elements within a loaded vim.
   * The operation is automatically split into batches if the array is large.
   *
   * @param vimIndex - The index of the loaded vim containing the elements
   * @param vimElementIndices - Array of vim-based element indices to apply the state to
   * @param state - The visibility state to apply (e.g., VISIBLE, HIDDEN)
   */
  RPCSetStateElements(vimIndex: number, vimElementIndices: number[], state: VisibilityState): void {
    if (vimElementIndices.length === 0) return
    if (!Validation.isIndex(vimIndex)) return
    if (!Validation.areIndices(vimElementIndices)) return

    const batches = batchArray(vimElementIndices, this.batchSize)
    for (const batch of batches) {
      this.rpc.RPCSetStateElements(vimIndex, batch, state)
    }
  }

  /**
   * Sets individual visibility states for multiple elements in a vim.
   * Each element receives a corresponding visibility state from the input array.
   * The operation is automatically split into batches if the array is large.
   *
   * @param vimIndex - The index of the loaded vim
   * @param vimElementIndices - Array of vim-based element indices
   * @param states - Array of visibility states to apply, one per element
   */
  RPCSetStatesElements(vimIndex: number, vimElementIndices: number[], states: VisibilityState[]): void {
    if (!Validation.isIndex(vimIndex)) return
    if (!Validation.areIndices(vimElementIndices)) return
    if (!Validation.areSameLength(vimElementIndices, states)) return

    const batches = batchArrays(vimElementIndices, states, this.batchSize)
    for (const [batchedElements, batchedStates] of batches) {
      this.rpc.RPCSetStatesElements(vimIndex, batchedElements, batchedStates)
    }
  }

  /**
   * Applies a single visibility state to all elements of a loaded vim.
   *
   * @param vimIndex - The index of the loaded vim
   * @param state - The visibility state to apply (e.g., VISIBLE, HIDDEN)
   */
  RPCSetStateVim(vimIndex: number, state: VisibilityState): void {
    if (!Validation.isIndex(vimIndex)) return
    this.rpc.RPCSetStateVim(vimIndex, state)
  }


  /*******************************************************************************
   * TEXT AND UI METHODS
   * Methods for creating and managing 3D text elements in the scene.
   ******************************************************************************/

  /**
   * Creates a 3D text element in the scene.
   * @param position - The world-space position for the text
   * @param color - The color of the text
   * @param text - The content to display
   * @returns Promise resolving to the handle of the created text component
   */
  async RPCCreateText(
    position: RpcTypes.Vector3,
    color: RpcTypes.RGBA32,
    text : string
  ): Promise<number> {
    // Validation
    if (!Validation.isNonEmptyString(text)) return INVALID_HANDLE
    if (!Validation.isValidVector3(position)) return INVALID_HANDLE

    // Run
    return await this.safeCall(
      () => this.rpc.RPCCreateText(position, color, text),
      INVALID_HANDLE
    )
  }

  /**
   * Destroys a text component, removing it from the scene.
   * @param componentHandle - The handle of the text component to destroy
   */
  RPCDestroyText(componentHandle: number): void {
    // Validation
    if (!Validation.isIndex(componentHandle)) return

    // Run
    this.rpc.RPCDestroyText(componentHandle)
  }

  /*******************************************************************************
   * SECTION BOX METHODS
   * Methods for controlling section box visibility and position.
   ******************************************************************************/
  
  /**
   * Enables or disables the section box.
   * @param enable - True to enable the section box, false to disable it
   */
  RPCEnableSectionBox(enable: boolean): void {
    this.rpc.RPCEnableSectionBox(enable)
  }

  /**
   * Sets the parameters of the section box.
   * @param state - The new section box state, including visibility and bounding box
   */
  RPCSetSectionBox(state: RpcTypes.SectionBoxState): void {
    this.rpc.RPCSetSectionBox(
      {
        ...state,
        box: state.box ?? new RpcTypes.Box3(new RpcTypes.Vector3(), new RpcTypes.Vector3())
      })
  }

  /**
   * Retrieves the current section box state.
   * @returns Promise resolving to the section box state or undefined on failure
   */
  async RPCGetSectionBox(): Promise<RpcTypes.SectionBoxState | undefined> {
    return await this.safeCall(
      () => this.rpc.RPCGetSectionBox(),
      undefined
    )
  }

  /*******************************************************************************
   * CAMERA AND VIEW METHODS
   * Methods for controlling camera position, movement, framing, and view settings.
   ******************************************************************************/

  /**
   * Retrieves the current camera position and orientation.
   * @returns Promise resolving to a segment representing the camera's current position and target
   */
  async RPCGetCameraView(): Promise<RpcTypes.Segment | undefined> {
    return await this.safeCall(
      () => this.rpc.RPCGetCameraView(),
      undefined
    )
  }

  /**
   * Sets the camera position and orientation.
   * @param segment - The desired camera position and target
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   */
  RPCSetCameraView(segment: RpcTypes.Segment, blendTime: number): void {
    // Validation
    if (!Validation.isValidSegment(segment)) return
    blendTime = Validation.clamp01(blendTime)

    // Run
    this.rpc.RPCSetCameraView(segment, blendTime)
  }

  /**
   * Sets the camera's position without changing its target.
   * The camera will move to the specified position while maintaining its current look-at direction.
   *
   * @param position - The new position of the camera in world space
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   */
  RPCSetCameraPosition(position: RpcTypes.Vector3, blendTime: number): void {
    // Validation
    if (!Validation.isValidVector3(position)) return
    blendTime = Validation.clamp01(blendTime)

    // Run
    this.rpc.RPCSetCameraPosition(position, blendTime)
  }

  /**
   * Sets the camera's look-at target without changing its position.
   * The camera will rotate to face the specified target while remaining at its current position.
   *
   * @param target - The new look-at target of the camera in world space
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   */
  RPCSetCameraTarget(target: RpcTypes.Vector3, blendTime: number): void {
    // Validation
    if (!Validation.isValidVector3(target)) return
    blendTime = Validation.clamp01(blendTime)

    // Run
    this.rpc.RPCSetCameraTarget(target, blendTime)
  }

  
  /**
   * Retrieves the axis-aligned bounding box (AABB) that encompasses the entire scene.
   * This includes all loaded geometry across all loaded vims.
   *
   * @returns Promise resolving to the global AABB of the scene, or undefined on failure
   */
  RPCGetAABBForScene(): Promise<RpcTypes.Box3 | undefined> {
    return this.safeCall(
      () => this.rpc.RPCGetAABBForScene(),
      undefined
    )
  }

  /**
   * Retrieves the axis-aligned bounding box (AABB) for a specific loaded vim.
   * This bounding box represents the spatial bounds of all geometry within the given loaded vim.
   *
   * @param vimIndex - The index of the loaded vim to query
   * @returns Promise resolving to the vim bounding box, or undefined on failure
   */
  async RPCGetAABBForVim(vimIndex: number): Promise<RpcTypes.Box3 | undefined> {
    if (!Validation.isIndex(vimIndex)) return undefined
    return await this.safeCall(
      () => this.rpc.RPCGetAABBForVim(vimIndex),
      undefined
    )
  }

  /**
   * Calculates the bounding box for specified elements of a loaded vim.
   * Large element arrays are automatically processed in batches.
   * @param vimIndex - The index of the loaded vim
   * @param vimElementIndices - Array of vim-based element indices to calculate bounds for
   * @returns Promise resolving to the combined bounding box or undefined on failure
   */
  async RPCGetAABBForElements(
    vimIndex: number,
    vimElementIndices: number[]
  ): Promise<RpcTypes.Box3 | undefined> {
    // Validation
    if (!Validation.isIndex(vimIndex)) return
    if (!Validation.areIndices(vimElementIndices)) return

    // Run
    return await this.safeCall(
      () => this.RPCGetAABBForElementsBatched(vimIndex, vimElementIndices),
      undefined
    )
  }

  private async RPCGetAABBForElementsBatched(
    vimIndex: number,
    vimElementIndices: number[]
  ): Promise<RpcTypes.Box3> {

    if(vimElementIndices.length === 0){
      return new RpcTypes.Box3()
    }

    const batches = batchArray(vimElementIndices, this.batchSize)
    const promises = batches.map(async (batch) => {
      const aabb = await this.rpc.RPCGetAABBForElements(vimIndex, batch)
      const v1 = new RpcTypes.Vector3(aabb.min.x, aabb.min.y, aabb.min.z)
      const v2 = new RpcTypes.Vector3(aabb.max.x, aabb.max.y, aabb.max.z)
      return new RpcTypes.Box3(v1, v2)
    })
    const boxes = await Promise.all(promises)
    const box = boxes[0]
    boxes.forEach((b) => box.union(b))
    return box
  }

  /**
   * Frames the camera to show all elements in the scene.
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   * @returns Promise resolving to camera segment representing the final position
   */
  async RPCFrameScene(blendTime: number): Promise<RpcTypes.Segment | undefined> {
    // Validation
    blendTime = Validation.clamp01(blendTime)

    // Run
    return await this.safeCall(
      () => this.rpc.RPCFrameScene(blendTime),
      undefined
    )
  }

  /**
   * Frames a specific vim in the scene.
   * @param vimIndex - The index of the loaded vim to frame
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   * @returns Promise resolving to camera segment representing the final position
   */
  async RPCFrameVim(vimIndex: number, blendTime: number): Promise<RpcTypes.Segment | undefined> {
    // Validation
    if (!Validation.isIndex(vimIndex)) return 
    blendTime = Validation.clamp01(blendTime)

    // Run
    return await this.safeCall(
      () => this.rpc.RPCFrameVim(vimIndex, blendTime),
      undefined
    )
  }

  /**
   * Frames specific elements of a loaded vim.
   * Automatically batches large arrays of elements.
   * @param vimIndex - The index of the loaded vim
   * @param vimElementIndices - Array of vim-based element indices to frame
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   * @returns Promise resolving to camera segment representing the final position
   */
  async RPCFrameElements(
    vimIndex: number,
    vimElementIndices: number[],
    blendTime: number
  ): Promise<RpcTypes.Segment | undefined> {
    // Validation
    if (!Validation.isIndex(vimIndex)) return
    if (!Validation.areIndices(vimElementIndices)) return 
    blendTime = Validation.clamp01(blendTime)

    // Run
    if (vimElementIndices.length < this.batchSize) {
      return await this.safeCall(
        () => this.rpc.RPCFrameElements(vimIndex, vimElementIndices, blendTime),
        undefined
      )
    } else {
      const box = await this.safeCall(
        () => this.RPCGetAABBForElementsBatched(vimIndex, vimElementIndices),
        undefined
      )
      if(!box) return undefined
      return await this.safeCall(
        () => this.rpc.RPCFrameAABB(box, blendTime),
        undefined
      )
    }
  }

  /**
   * Frames the camera to show a specific bounding box.
   * @param box - The bounding box to frame
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   */
  async RPCFrameAABB(box: RpcTypes.Box3, blendTime: number): Promise<RpcTypes.Segment | undefined> {
    // Validation
    if (!Validation.isValidBox(box)) return
    blendTime = Validation.clamp01(blendTime)

    // Run
    return await this.safeCall(
      () => this.rpc.RPCFrameAABB(box, blendTime),
      undefined
    )
  }

  /*******************************************************************************
   * INPUT HANDLING METHODS
   * Methods for handling user input including mouse, keyboard, and camera controls.
   ******************************************************************************/

  /**
   * Sets the camera movement speed.
   * @param speed - The desired movement speed (must be positive)
   */
  RPCSetCameraSpeed(speed: number) {
    // Validation
    speed = Validation.min0(speed)

    // Run
    this.rpc.RPCSetCameraSpeed(speed)
  }

  /**
   * Sets the camera control mode.
   * @param mode - The desired input mode (e.g., {@link InputMode.Orbit} or {@link InputMode.Free})
   */
  RPCSetCameraMode(mode: InputMode): void {
    this.rpc.RPCSetCameraMode(mode === InputMode.Orbit)
  }

  /**
   * Sets the viewer's aspect ratio.
   * @param width - The width of the desired aspect ratio
   * @param height - The height of the desired aspect ratio
   */
  RPCSetCameraAspectRatio(width: number, height: number): void {
    // Validation
    if (!Validation.isPositiveInteger(width)) return
    if (!Validation.isPositiveInteger(height)) return

    // Run
    this.rpc.RPCSetCameraAspectRatio(width, height)
  }

  /*******************************************************************************
   * VIM FILE MANAGEMENT METHODS
   * Methods for loading, unloading, and managing VIM files.
   ******************************************************************************/

  /**
   * Loads a VIM file from the local filesystem.
   * @param source - The path to the VIM file (supports file:// protocol)
   * @returns Promise resolving to the index of the loaded vim
   */
  async RPCLoadVim(source: VimSource): Promise<number> {
    // Validation
    if (!Validation.isNonEmptyString(source.url)) return INVALID_HANDLE
    const url = source.url.replace("file:///", "file://")

    // Run
    return await this.safeCall(
      () => this.rpc.RPCLoadVim(url),
      INVALID_HANDLE
    )
  }

  /**
   * Loads a VIM file from a remote URL.
   * @param source - The URL or file path of the VIM file to load
   * @returns Promise resolving to the index of the loaded vim
   */
  async RPCLoadVimURL(source: VimSource): Promise<number> {
    // Validation
    if (!Validation.isURL(source.url)) return INVALID_HANDLE

    // Run
    return await this.safeCall(
      () => this.rpc.RPCLoadVimURL(source.url, source.authToken ?? ""),
      INVALID_HANDLE
    )
  }

  /**
   * Retrieves the current loading state and progress of a vim.
   * @param vimIndex - The index of the vim being loaded
   * @returns Promise resolving to the current loading state and progress
   */
  async RPCGetVimLoadingState(vimIndex: number): Promise<VimLoadingState> {
    // Validation
    if (!Validation.isIndex(vimIndex)) {
      return { status: VimLoadingStatus.Unknown, progress: 0 }
    }
    
    // Run
    const result = await this.safeCall(
      () => this.rpc.RPCGetVimLoadingState(vimIndex),
      { status: VimLoadingStatus.Unknown, progress: 0 }
    )

    if(!(result.status in VimLoadingStatus)){
      result.status = VimLoadingStatus.Unknown
    }

    return result as VimLoadingState
  }

  /**
   * Clears the entire scene, unloading all vims and resetting to initial state.
   */
  RPCUnloadAll(): void {
    this.rpc.RPCUnloadAll()
  }

  /**
   * Sets the color used for ghosted geometry.
   * @param ghostColor - The RGBA color to use for ghosted elements
   */
  RPCSetGhostColor(ghostColor: RpcTypes.RGBA): void {
    const color = Validation.clampRGBA01(ghostColor)
    this.rpc.RPCSetGhostColor(color)
  }

  /**
   * Performs hit testing at a specified screen position.
   * @param pos - Normalized screen coordinates (0-1, 0-1)
   * @returns Promise resolving to hit test result if a valid hit was detected, undefined otherwise
   */
  async RPCPerformHitTest(pos: RpcTypes.Vector2): Promise<RpcTypes.HitCheckResult | undefined> {
    // Validation
    if (!Validation.isRelativeVector2(pos)) return

    // Run
    const result = await this.safeCall(
      () => this.rpc.RPCPerformHitTest(pos),
      undefined
    )
    if (!result || result.vimIndex === INVALID_HANDLE) {
      return undefined
    }
    return result
  }

  /**
   * Sends a mouse button event to the viewer.
   * @param position - The normalized screen coordinates (0-1, 0-1)
   * @param mouseButton - The mouse button code (0=left, 1=middle, 2=right)
   * @param down - True if button is pressed down, false if released
   */
  RPCMouseButtonEvent(
    position: RpcTypes.Vector2,
    mouseButton: number,
    down: boolean
  ){
    // Validation
    if (!Validation.isPositiveInteger(mouseButton)) return
    if (!Validation.isRelativeVector2(position)) return

    // Run
    this.rpc.RPCMouseButtonEvent(position, mouseButton, down)
  }

  /**
   * Sends a mouse double-click event to the viewer.
   * @param position - The normalized screen coordinates (0-1, 0-1)
   * @param mouseButton - The mouse button code (0=left, 1=middle, 2=right)
   */
  RPCMouseDoubleClickEvent(
    position: RpcTypes.Vector2,
    mouseButton: number
  ): void {
    // Validation
    if (!Validation.isPositiveInteger(mouseButton)) return
    if (!Validation.isRelativeVector2(position)) return
    // Run
    this.rpc.RPCMouseDoubleClickEvent(position, mouseButton)
  }

  /**
   * Sends a mouse movement event to the viewer.
   * @param position - The normalized screen coordinates (0-1, 0-1)
   */
  RPCMouseMoveEvent(position: RpcTypes.Vector2): void {
    // Validation
    if (!Validation.isRelativeVector2(position)) return

    // Run
    this.rpc.RPCMouseMoveEvent(position)
  }

  /**
   * Sends a mouse scroll wheel event to the viewer.
   * @param scrollValue - The scroll amount (-1 to 1)
   */
  RPCMouseScrollEvent(scrollValue: number): void {
    // Validation
    scrollValue = Validation.clamp(-1, 1, scrollValue)

    // Run
    this.rpc.RPCMouseScrollEvent(scrollValue)
  }

  /**
   * Sends a mouse selection event to the viewer.
   * @param position - The normalized screen coordinates (0-1, 0-1)
   * @param mouseButton - The mouse button code (0=left, 1=middle, 2=right)
   */
  RPCMouseSelectEvent(
    position: RpcTypes.Vector2,
    mouseButton: number
  ): void {
    // Validation
    if (!Validation.isPositiveInteger(mouseButton)) return
    if (!Validation.isRelativeVector2(position)) return

    // Run
    this.rpc.RPCMouseSelectEvent(position, mouseButton)
  }

  /**
   * Sends a keyboard event to the viewer.
   * @param keyCode - The key code of the event
   * @param down - True if key is pressed down, false if released
   */
  RPCKeyEvent(keyCode: number, down: boolean): void {
    // Validation
    if (!Validation.isPositiveInteger(keyCode)) return

    // Run
    this.rpc.RPCKeyEvent(keyCode, down)
  }

  /*******************************************************************************
   * MATERIAL MANAGEMENT METHODS
   * Methods for creating and managing materials and material instances.
   ******************************************************************************/

  /**
   * Creates multiple material instances with the same smoothness but different colors.
   * Large color arrays are automatically processed in batches for better performance.
   * @param materialHandle - The base material to create instances from
   * @param smoothness - The smoothness value to apply (clamped between 0 and 1)
   * @param colors - Array of colors for each material instance
   * @returns Array of handles for the created material instances
   */
  async RPCCreateMaterialInstances(
    materialHandle: MaterialHandle,
    smoothness: number,
    colors: RpcTypes.RGBA32[]
  ): Promise<number[] | undefined> {
    if (!Validation.isMaterialHandle(materialHandle)) return 
    if (!Validation.isFullArray(colors)) return
    if(!Validation.isPositiveNumber(smoothness)) return 

    return await this.safeCall(
      () => this.createMaterialInstancesBatched(materialHandle, smoothness, colors),
      undefined
    )
  }

  private async createMaterialInstancesBatched(
    materialHandle: number,
    smoothness: number,
    colors: RpcTypes.RGBA32[]
  ): Promise<number[]> {
    const batches = batchArray(colors, this.batchSize)
    const promises = batches.map(async (batch) => {
      const id = await this.rpc.RPCCreateMaterialInstances(materialHandle, smoothness, batch)
      return Array.from({ length: batch.length }, (_, index) => id + index)
    })
    const handles = await Promise.all(promises)
    const result = handles.flat()
    return result
  }

  /**
   * Destroys multiple material instances, freeing associated resources.
   * @param materialInstanceHandles - Array of handles for material instances to destroy
   */
  RPCDestroyMaterialInstances(materialInstanceHandles: number[]): void {
    // Validation
    if (!Validation.areIndices(materialInstanceHandles)) return

    // Run
    this.rpc.RPCDestroyMaterialInstances(materialInstanceHandles)
  }

  /**
   * Sets material overrides for specific elements in a loaded vim.
   * Large arrays are automatically processed in batches.
   * @param vimIndex - The index of the loaded vim
   * @param vimElementIndices - Array of vim-based element indices to override
   * @param materialInstanceHandles - Array of material instance handles to apply (must match element length)
   */
  RPCSetMaterialOverridesForElements(
    vimIndex: number,
    vimElementIndices: number[],
    materialInstanceHandles: number[]
  ): void {
    // Validation
    if (!Validation.areSameLength(vimElementIndices, materialInstanceHandles)) return
    if (!Validation.isIndex(vimIndex)) return
    if (!Validation.areIndices(vimElementIndices)) return
    if (!Validation.areIntegers(materialInstanceHandles)) return

    // Run
    this.setMaterialOverridesBatched(
      vimIndex,
      vimElementIndices,
      materialInstanceHandles
    )
  }

  private setMaterialOverridesBatched(
    vimIndex: number,
    vimElementIndices: number[],
    materialInstanceHandles: number[]
  ): void {

    // Run
    const batches = batchArrays(vimElementIndices, materialInstanceHandles, this.batchSize)
  
    for (const [batchedElements, batchedMaterials] of batches) {
      this.rpc.RPCSetMaterialOverridesForElements(vimIndex, batchedElements, batchedMaterials)
    }
  }

  /**
   * Clears all material overrides for the entire scene.
   */
  RPCClearMaterialOverrides(): void {
    // Run
    this.rpc.RPCClearMaterialOverrides()
  }

  /*******************************************************************************
   * DEBUG AND UTILITY METHODS
   * Utility methods for debugging, error handling, and misc functionality.
   ******************************************************************************/

  /**
   * Retrieves the current API version from the RPC client.
   * @returns Promise resolving to the API version string
   */
  async RPCGetAPIVersion(): Promise<string> {
    return await this.safeCall(
      () => this.rpc.RPCGetAPIVersion(),
      ""
    )
  }

  /**
   * Gets the API version of the underlying RPC client.
   * @returns The API version string.
   */
  get API_VERSION(): string {
    return this.rpc.API_VERSION
  }

  /**
   * Retrieves the last error message from the RPC client.
   * @returns Promise resolving to the last error message string
   */
  async RPCGetLastError(): Promise<string> {
    return await this.safeCall(
      () => this.rpc.RPCGetLastError(),
      ""
    )
  }

  /**
   * Pauses or resumes the rendering loop.
   * @param pause - True to pause rendering, false to resume
   */
  RPCPauseRendering(pause: boolean): void {
    this.rpc.RPCPauseRendering(pause)
  }

  /**
   * Triggers a RenderDoc frame capture if RenderDoc is attached.
   */
  RPCTriggerRenderDocCapture(): void {
    this.rpc.RPCTriggerRenderDocCapture()
  }

  private async safeCall<T, TDefault>(func: () => Promise<T>, defaultValue: TDefault): Promise<T | TDefault> {
    try{
      return await func()
    } catch(e){
      console.error(e)
      return defaultValue
    }
  }
}
