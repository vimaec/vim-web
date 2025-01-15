import { Box3, RGBA, RGBA32, Segment, Vector2, Vector3 } from "../utils/math3d"
import { HitCheckResult } from "./marshal"
import { MaterialHandle, RpcClient } from "./rpcClient"
import { Validation } from "../utils/validation"
import { batchArray, batchArrays } from "../utils/array"
import { INVALID_HANDLE } from "./viewer"

const defaultBatchSize = 10000

export type VimSource = {
  url: string;
  authToken? : string;
}

export type VimLoadingState = {
  status: VimLoadingStatus;
  progress: number;
}

export enum InputMode {
  Orbit = 'orbit',
  Free = 'free'
}

export type SceneSettings = {
  toneMappingWhitePoint: number
  hdrScale: number
  hdrBackgroundScale: number
  hdrBackgroundSaturation: number
  backGroundBlur: number
  backgroundColor: RGBA
}

export const defaultSceneSettings: SceneSettings = {
  toneMappingWhitePoint: 0.1009,
  hdrScale: 1.37,
  hdrBackgroundScale: 1.0,
  hdrBackgroundSaturation: 1.0,
  backGroundBlur: 1.0,
  backgroundColor: new RGBA(0.9, 0.9, 0.9, 1.0)
}

export enum VimLoadingStatus {
  Unknown = 0,
  Loading = 1,
  Downloading = 2,
  Done = 3,
  FailedToDownload = 4,
  FailedToLoad = 5
}
/**
 * Provides safe, validated methods to interact with the RpcClient.
 * This class wraps the raw RPC methods with input validation and batching support for large operations.
 */
export class RpcSafeClient {
  private readonly rpc: RpcClient
  private readonly batchSize: number

  get url(): string {
    return this.rpc.url
  }

  get connected(): boolean {
    return this.rpc.connected
  }

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
   * Initializes and starts the scene with specified settings.
   * @param settings - Optional partial scene settings to override defaults
   * @remarks If no settings are provided, default values will be used
   */
  async RPCStartScene(settings?: Partial<SceneSettings>): Promise<boolean> {
    const s = { ...defaultSceneSettings, ...(settings ?? {}) }

    return await this.safeCall( 
      () => this.rpc.RPCStartScene(
        Validation.clamp01(s.toneMappingWhitePoint),
        Validation.min0(s.hdrScale),
        Validation.clamp01(s.hdrBackgroundScale),
        Validation.clamp01(s.hdrBackgroundSaturation),
        Validation.clamp01(s.backGroundBlur),
        Validation.clampRGBA01(s.backgroundColor)
      ),
      false
    )
  }

  /**
   * Sets the lighting settings for the scene.
   * @param settings - The lighting settings to apply
   */
  RPCSetLighting(settings: SceneSettings): void {
    const s = settings
    this.rpc.RPCSetLighting(
      Validation.clamp01(s.toneMappingWhitePoint),
      Validation.min0(s.hdrScale),
      Validation.clamp01(s.hdrBackgroundScale),
      Validation.clamp01(s.hdrBackgroundSaturation),
      Validation.clamp01(s.backGroundBlur),
      Validation.clampRGBA01(s.backgroundColor)
    )
  }

  RPCLockIblRotation(lock: boolean): void {
    this.rpc.RPCLockIblRotation(lock)
  }

  /*******************************************************************************
   * NODE VISIBILITY METHODS
   * Methods for controlling node visibility, including show/hide, ghosting,
   * and highlighting functionality.
   ******************************************************************************/

  /**
   * Hides all nodes in a component, making the entire component invisible.
   * @param componentHandle - The component to hide entirely
   * @throws {Error} If the component handle is invalid
   */
  RPCHideAll(componentHandle: number): void {
    if (!Validation.isComponentHandle(componentHandle)) return
    this.rpc.RPCHideAll(componentHandle)
  }

  /**
   * Shows all nodes in a component, making the entire component visible.
   * @param componentHandle - The component to show entirely
   * @throws {Error} If the component handle is invalid
   */ 
  RPCShowAll(componentHandle: number): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return

    // Run
    this.rpc.RPCShowAll(componentHandle)
  }

  /**
   * Makes all nodes in a component semi-transparent (ghosted).
   * @param componentHandle - The component to ghost entirely
   * @throws {Error} If the component handle is invalid
   */
  RPCGhostAll(componentHandle: number): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return

    // Run
    this.rpc.RPCGhostAll(componentHandle)
  }

  /**
   * Highlights all nodes in a component.
   * @param componentHandle - The component to highlight entirely
   * @throws {Error} If the component handle is invalid
   */
    RPCHighlightAll(componentHandle: number): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return

    // Run
    this.rpc.RPCHighlightAll(componentHandle)
  }

  /**
   * Hides specified nodes in a component, making them invisible.
   * Large node arrays are automatically processed in batches.
   * @param componentHandle - The component containing the nodes
   * @param nodes - Array of node indices to hide
   * @throws {Error} If the component handle is invalid or nodes array is invalid
   */
  RPCHide(componentHandle: number, nodes: number[]): void {
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(nodes)) return

    const batches = batchArray(nodes, this.batchSize)
    for (const batch of batches) {
      this.rpc.RPCHide(componentHandle, batch)
    }
  }

  /**
   * Shows specified nodes in a component, making them visible.
   * Large node arrays are automatically processed in batches.
   * @param componentHandle - The component containing the nodes
   * @param nodes - Array of node indices to show
   * @throws {Error} If the component handle is invalid or nodes array is invalid
   */
  RPCShow(componentHandle: number, nodes: number[]): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(nodes)) return

    // Run
    const batches = batchArray(nodes, this.batchSize)
    for (const batch of batches) {
      this.rpc.RPCShow(componentHandle, batch)
    }
  }

  /**
   * Makes specified nodes semi-transparent (ghosted) in a component.
   * Large node arrays are automatically processed in batches.
   * @param componentHandle - The component containing the nodes
   * @param nodes - Array of node indices to ghost
   * @throws {Error} If the component handle is invalid or nodes array is invalid
   */
  RPCGhost(componentHandle: number, nodes: number[]): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(nodes)) return

    // Run
    const batches = batchArray(nodes, this.batchSize)
    for (const batch of batches) {
      this.rpc.RPCGhost(componentHandle, batch)
    }
  }

  /**
   * Highlights specified nodes in a component.
   * Large node arrays are automatically processed in batches.
   * @param componentHandle - The component containing the nodes
   * @param nodes - Array of node indices to highlight
   * @throws {Error} If the component handle is invalid or nodes array is invalid
   */
  RPCHighlight(componentHandle: number, nodes: number[]): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(nodes)) return

    // Run
    const batches = batchArray(nodes, this.batchSize)
    for (const batch of batches) {
      this.rpc.RPCHighlight(componentHandle, batch)
    }
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
   * @throws {Error} If the text is empty
   */
  async RPCCreateText(
    position: Vector3,
    color: RGBA32,
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
   * @throws {Error} If the component handle is invalid
   */
  RPCDestroyText(componentHandle: number): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return

    // Run
    this.rpc.RPCDestroyText(componentHandle)
  }

  /*******************************************************************************
   * CAMERA AND VIEW METHODS
   * Methods for controlling camera position, movement, framing, and view settings.
   ******************************************************************************/

  /**
   * Retrieves the current camera position and orientation.
   * @returns Promise resolving to a segment representing the camera's current position and target
   */
  async RPCGetCameraPosition(): Promise<Segment | undefined> {
    return await this.safeCall(
      () => this.rpc.RPCGetCameraPosition(),
      undefined
    )
  }

  /**
   * Sets the camera position and orientation.
   * @param segment - The desired camera position and target
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   * @throws {Error} If segment is invalid or blendTime is negative
   */
  RPCSetCameraPosition(segment: Segment, blendTime: number): void {
    // Validation
    if (!Validation.isValidSegment(segment)) return
    blendTime = Validation.clamp01(blendTime)

    // Run
    this.rpc.RPCSetCameraPosition(segment, blendTime)
  }

  /**
   * Calculates the bounding box for specified nodes in a component.
   * Large node arrays are automatically processed in batches for better performance.
   * @param componentHandle - The component containing the nodes
   * @param nodes - Array of node indices to calculate bounds for
   * @returns Promise resolving to the combined bounding box
   * @throws {Error} If the component handle is invalid or nodes array is invalid
   */
  async RPCGetBoundingBox(
    componentHandle: number,
    nodes: number[]
  ): Promise<Box3 | undefined> {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(nodes)) return

    // Run
    return await this.safeCall(
      () => this.getBoundingBoxBatched(componentHandle, nodes),
      undefined
    )
  }

  private async getBoundingBoxBatched(
    componentHandle: number,
    nodes: number[]
  ): Promise<Box3> {

    if(nodes.length === 0){
      return new Box3()
    }

    const batches = batchArray(nodes, this.batchSize)
    const promises = batches.map(async (batch) => {
      const aabb = await this.rpc.RPCGetBoundingBox(componentHandle, batch)
      const v1 = new Vector3(aabb.min.x, aabb.min.y, aabb.min.z)
      const v2 = new Vector3(aabb.max.x, aabb.max.y, aabb.max.z)
      return new Box3(v1, v2)
    })
    const boxes = await Promise.all(promises)
    const box = boxes[0]
    boxes.forEach((b) => box.union(b))
    return box
  }

  /**
   * Frames the camera to show all components in the scene.
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   * @returns Promise resolving to camera segment representing the final position
   */
  async RPCFrameAll(blendTime: number): Promise<Segment | undefined> {
    // Validation
    blendTime = Validation.clamp01(blendTime)

    // Run
    return await this.safeCall(
      () => this.rpc.RPCFrameAll(blendTime),
      undefined
    )
  }

  /**
   * Frames a specific VIM component in the scene.
   * @param componentHandle - The handle of the VIM component to frame
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   * @returns Promise resolving to camera segment representing the final position
   * @throws {Error} If the component handle is invalid
   */
  async RPCFrameVim(componentHandle: number, blendTime: number): Promise<Segment | undefined> {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return 
    blendTime = Validation.clamp01(blendTime)

    // Run
    return await this.safeCall(
      () => this.rpc.RPCFrameVim(componentHandle, blendTime),
      undefined
    )
  }

  /**
   * Frames specific instances within a component. For large numbers of instances,
   * automatically switches to bounding box framing for better performance.
   * @param componentHandle - The component containing the instances
   * @param nodes - Array of node indices to frame
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   * @returns Promise resolving to camera segment representing the final position
   * @throws {Error} If the component handle is invalid or nodes array is empty
   */
  async RPCFrameInstances(
    componentHandle: number,
    nodes: number[],
    blendTime: number
  ): Promise<Segment | undefined> {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(nodes)) return 
    blendTime = Validation.clamp01(blendTime)

    // Run
    if (nodes.length < this.batchSize) {
      return await this.safeCall(
        () => this.rpc.RPCFrameInstances(componentHandle, nodes, blendTime),
        undefined
      )
    } else {
      const box = await this.safeCall(
        () => this.getBoundingBoxBatched(componentHandle, nodes),
        undefined
      )
      if(!box) return undefined
      return await this.safeCall(
        () => this.rpc.RPCFrameBox(box, blendTime),
        undefined
      )
    }
  }

  /**
   * Frames the camera to show a specific bounding box.
   * @param box - The bounding box to frame
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   * @throws {Error} If the box is invalid (min values must be less than max values)
   */
  async RPCFrameBox(box: Box3, blendTime: number): Promise<Segment | undefined> {
    // Validation
    if (!Validation.isValidBox(box)) return
    blendTime = Validation.clamp01(blendTime)

    // Run
    return await this.safeCall(
      () => this.rpc.RPCFrameBox(box, blendTime),
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
   * @throws {Error} If speed is not positive
   */
  RPCSetMoveSpeed(speed: number) {
    // Validation
    speed = Validation.min0(speed)

    // Run
    this.rpc.RPCSetMoveSpeed(speed)
  }

  RPCSetCameraMode(mode: InputMode): void {
    this.rpc.RPCSetCameraMode(mode === InputMode.Orbit)
  }

  /**
   * Sets the viewer's aspect ratio.
   * @param width - The width component of the aspect ratio
   * @param height - The height component of the aspect ratio
   * @throws {Error} If width or height are not positive integers
   */
  RPCSetAspectRatio(width: number, height: number): void {
    // Validation
    if (!Validation.isPositiveInteger(width)) return
    if (!Validation.isPositiveInteger(height)) return

    // Run
    this.rpc.RPCSetAspectRatio(width, height)
  }

  /*******************************************************************************
   * VIM FILE MANAGEMENT METHODS
   * Methods for loading, unloading, and managing VIM files and components.
   ******************************************************************************/

  /**
   * Loads a VIM file from the local filesystem.
   * @param source - The path to the VIM file (supports file:// protocol)
   * @returns Promise resolving to the handle of the loaded VIM component
   * @throws {Error} If the filename is invalid or empty
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
   * @param url - The URL of the VIM file to load
   * @returns Promise resolving to the handle of the loaded VIM component
   * @throws {Error} If the URL is invalid
   */
  async RPCLoadVimURL(source: VimSource): Promise<number> {
    // Validation
    if (!Validation.isURL(source.url)) return INVALID_HANDLE

    // Run
    return await this.safeCall(
      () => this.rpc.RPCLoadVimURL(source.url, source.authToken),
      INVALID_HANDLE
    )
  }

  /**
   * Retrieves the current loading state and progress of a VIM component.
   * @param componentHandle - The handle of the VIM component
   * @returns Promise resolving to the current loading state and progress
   * @throws {Error} If the component handle is invalid
   */
  async RPCGetVimLoadingState(componentHandle: number): Promise<VimLoadingState> {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) {
      return { status: VimLoadingStatus.Unknown, progress: 0 }
    }
    
    // Run
    const result = await this.safeCall(
      () => this.rpc.RPCGetVimLoadingState(componentHandle),
      { status: VimLoadingStatus.Unknown, progress: 0 }
    )

    if(!(result.status in VimLoadingStatus)){
      result.status = VimLoadingStatus.Unknown
    }

    return result as VimLoadingState
  }

  /**
   * Unloads a VIM component and frees associated resources.
   * @param componentHandle - The handle of the component to unload
   * @throws {Error} If the component handle is invalid
   */
  RPCUnloadVim(componentHandle: number): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return

    // Run
    this.rpc.RPCUnloadVim(componentHandle)
  }

  /**
   * Clears the entire scene, removing all components and resetting to initial state.
   */
  RPCClearScene(): void {
    this.rpc.RPCClearScene()
  }

  /**
   * Sets the color used for ghosted geometry.
   * @param ghostColor - The RGBA color to use for ghosted elements
   */
  RPCSetGhostColor(ghostColor: RGBA): void {
    const color = Validation.clampRGBA01(ghostColor)
    this.rpc.RPCSetGhostColor(color)
  }

  /**
   * Performs hit testing at a specified screen position.
   * @param pos - Normalized screen coordinates (0-1, 0-1)
   * @returns Promise resolving to hit test result if something was hit, undefined otherwise
   */
  async RPCPerformHitTest(pos: Vector2): Promise<HitCheckResult | undefined> {
    // Validation
    if (!Validation.isRelativeVector2(pos)) return

    // Run
    const result = await this.safeCall(
      () => this.rpc.RPCPerformHitTest(pos),
      undefined
    )
    if (!result || result.nodeIndex < 0){
      return undefined
    }
    return result
  }

  /**
   * Sends a mouse button event to the viewer.
   * @param position - The normalized screen coordinates (0-1, 0-1)
   * @param mouseButton - The mouse button code (0=left, 1=middle, 2=right)
   * @param down - True if button is pressed down, false if released
   * @throws {Error} If mouseButton is not a valid positive integer
   */
  RPCMouseButtonEvent(
    position: Vector2,
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
   * @throws {Error} If mouseButton is not a valid positive integer
   */
  RPCMouseDoubleClickEvent(
    position: Vector2,
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
  RPCMouseMoveEvent(position: Vector2): void {
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
   * @throws {Error} If mouseButton is not a valid positive integer
   */
  RPCMouseSelectEvent(
    position: Vector2,
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
   * @throws {Error} If the material handle is invalid or smoothness is out of range
   */
  async RPCCreateMaterialInstances(
    materialHandle: MaterialHandle,
    smoothness: number,
    colors: RGBA32[]
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
    colors: RGBA32[]
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
   * @param materialInstanceHandle - Array of handles for material instances to destroy
   * @throws {Error} If any handle in the array is invalid
   */
  RPCDestroyMaterialInstances(materialInstanceHandle: number[]): void {
    // Validation
    if (!Validation.areComponentHandles(materialInstanceHandle)) return

    // Run
    this.rpc.RPCDestroyMaterialInstances(materialInstanceHandle)
  }

  /**
   * Sets material overrides for specific nodes in a component.
   * Large arrays are automatically processed in batches for better performance.
   * @param componentHandle - The component containing the nodes
   * @param nodes - Array of node indices to override
   * @param materialInstanceHandles - Array of material instance handles to apply (must match nodes length)
   * @throws {Error} If arrays have different lengths or any handle is invalid
   */
  RPCSetMaterialOverrides(
    componentHandle: number,
    nodes: number[],
    materialInstanceHandles: number[]
  ): void {
    // Validation
    if (!Validation.areSameLength(nodes, materialInstanceHandles)) return
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(nodes)) return
    if (!Validation.areIntegers(materialInstanceHandles)) return

    // Run
    this.setMaterialOverridesBatched(
      componentHandle,
      nodes,
      materialInstanceHandles
    )
  }

  private setMaterialOverridesBatched(
    componentHandle: number,
    nodes: number[],
    materialInstanceHandles: number[]
  ): void {

    // Run
    const batches = batchArrays(nodes, materialInstanceHandles, this.batchSize)
  
    for (const [batchedNodes, batchedMaterials] of batches) {
      this.rpc.RPCSetMaterialOverrides(componentHandle, batchedNodes, batchedMaterials)
    }
  }

  /**
   * Clears all material overrides for the specified component, restoring default materials.
   * @param componentHandle - The unique identifier of the component
   * @throws {Error} If the component handle is invalid or INVALID_HANDLE
   */
  RPCClearMaterialOverrides(componentHandle: number): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return

    // Run
    this.rpc.RPCClearMaterialOverrides(componentHandle)
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

  /**
   * Shows axis-aligned bounding boxes (AABBs) for specified nodes with custom colors.
   * Large arrays are automatically processed in batches for better performance.
   * @param componentHandle - The component containing the nodes
   * @param nodes - Array of node indices to show AABBs for
   * @param colors - Array of colors for each AABB (must match nodes length)
   * @throws {Error} If arrays have different lengths or component handle is invalid
   */
  RPCShowAABBs(
    componentHandle: number,
    nodes: number[],
    colors: RGBA32[]
  ): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(nodes)) return

    // Run
    const batches = batchArrays(nodes, colors, this.batchSize)
    for (const [batchedNodes, batchedColors] of batches) {
      this.rpc.RPCShowAABBs(componentHandle, batchedNodes, batchedColors)
    }
  }

  /**
   * Hides the axis-aligned bounding boxes (AABBs) for specified nodes.
   * Large node arrays are automatically processed in batches.
   * @param componentHandle - The component containing the nodes
   * @param nodes - Array of node indices whose AABBs should be hidden
   * @throws {Error} If the component handle is invalid or nodes array is invalid
   */
  RPCHideAABBs(componentHandle: number, nodes: number[]): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(nodes)) return

    // Run
    const batches = batchArray(nodes, this.batchSize)
    for (const batch of batches) {
      this.rpc.RPCHideAABBs(componentHandle, batch)
    }
  }

  /**
   * Hides all axis-aligned bounding boxes (AABBs) in a component.
   * @param componentHandle - The component whose AABBs should be hidden
   * @throws {Error} If the component handle is invalid
   */
  RPCHideAllAABBs(componentHandle: number): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return

    // Run
    this.rpc.RPCHideAllAABBs(componentHandle)
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
