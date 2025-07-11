import * as RpcTypes from "./rpcTypes"
import { MaterialHandle, RpcClient } from "./rpcClient"
import { Validation } from "../../utils";
import { batchArray, batchArrays } from "../../utils/array"
import { INVALID_HANDLE } from "./viewer"
import { VisibilityState } from "./visibility";

const defaultBatchSize = 10000

//TODO: Share both VIMSource
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
  backgroundColor: RpcTypes.RGBA
}

export const defaultSceneSettings: SceneSettings = {
  toneMappingWhitePoint: 0.1009,
  hdrScale: 1.37,
  hdrBackgroundScale: 1.0,
  hdrBackgroundSaturation: 1.0,
  backGroundBlur: 1.0,
  backgroundColor: new RpcTypes.RGBA(0.9, 0.9, 0.9, 1.0)
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
 


  /*******************************************************************************
   * NODE VISIBILITY METHODS
   * Methods for controlling node visibility, including show/hide, ghosting,
   * and highlighting functionality.
   ******************************************************************************/

  /**
   * Highlights specified nodes in a component.
   * Large node arrays are automatically processed in batches.
   * @param componentHandle - The component containing the nodes
   * @param nodes - Array of node indices to highlight
   * @throws {Error} If the component handle is invalid or nodes array is invalid
   */
  RPCSetStateElements(componentHandle: number, elements: number[], state: VisibilityState): void {
    if(elements.length === 0) return
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(elements)) return

    // Run
    const batches = batchArray(elements, this.batchSize)
    for (const batch of batches) {
      this.rpc.RPCSetStateElements(componentHandle, batch, state)
    }
  }

  RPCSetStatesElements(componentHandle: number, elements: number[], states: VisibilityState[]): void {
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(elements)) return
    if (!Validation.areSameLength(elements, states)) return


    const batches = batchArrays(elements, states, this.batchSize)
    for (const [batchedElements, batchedStates] of batches) {
      this.rpc.RPCSetStatesElements(componentHandle, batchedElements, batchedStates)
    }
  }



  RPCSetStateVim(componentHandle: number, state: VisibilityState): void {
    if (!Validation.isComponentHandle(componentHandle)) return
    this.rpc.RPCSetStateVim(componentHandle, state)
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
   * @throws {Error} If the component handle is invalid
   */
  RPCDestroyText(componentHandle: number): void {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return

    // Run
    this.rpc.RPCDestroyText(componentHandle)
  }

  /*******************************************************************************
   * SECTION BOX METHODS
   * Methods for controlling section box visibility and position.
   ******************************************************************************/
  
  RPCEnableSectionBox(enable: boolean): void {
    this.rpc.RPCEnableSectionBox(enable)
  }

  RPCSetSectionBox(state: RpcTypes.SectionBoxState): void {
    this.rpc.RPCSetSectionBox(
      {
        ...state,
        box: state.box ?? new RpcTypes.Box3(new RpcTypes.Vector3(), new RpcTypes.Vector3())
      })
  }

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
   * This includes all loaded geometry across all VIM components.
   *
   * @returns Promise resolving to the global AABB of the scene, or undefined on failure
   */
  RPCGetAABBForAll(): Promise<RpcTypes.Box3 | undefined> {
    return this.safeCall(
      () => this.rpc.RPCGetAABBForAll(),
      undefined
    )
  }

  /**
   * Retrieves the axis-aligned bounding box (AABB) for a specific VIM component.
   * This bounding box represents the spatial bounds of all geometry within the given component.
   *
   * @param componentHandle - The handle of the VIM component to query
   * @returns Promise resolving to the component’s bounding box, or undefined on failure
   */
  async RPCGetAABBForVim(componentHandle: number): Promise<RpcTypes.Box3 | undefined> {
    return await this.safeCall(
      () => this.rpc.RPCGetAABBForVim(componentHandle),
      undefined
    )
  }

  /**
   * Calculates the bounding box for specified nodes in a component.
   * Large node arrays are automatically processed in batches for better performance.
   * @param componentHandle - The component containing the nodes
   * @param elements - Array of node indices to calculate bounds for
   * @returns Promise resolving to the combined bounding box
   * @throws {Error} If the component handle is invalid or nodes array is invalid
   */
  async RPCGetAABBForElements(
    componentHandle: number,
    elements: number[]
  ): Promise<RpcTypes.Box3 | undefined> {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(elements)) return

    // Run
    return await this.safeCall(
      () => this.RPCGetAABBForElementsBatched(componentHandle, elements),
      undefined
    )
  }

  private async RPCGetAABBForElementsBatched(
    componentHandle: number,
    elements: number[]
  ): Promise<RpcTypes.Box3> {

    if(elements.length === 0){
      return new RpcTypes.Box3()
    }

    const batches = batchArray(elements, this.batchSize)
    const promises = batches.map(async (batch) => {
      const aabb = await this.rpc.RPCGetAABBForElements(componentHandle, batch)
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
   * Frames the camera to show all components in the scene.
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   * @returns Promise resolving to camera segment representing the final position
   */
  async RPCFrameAll(blendTime: number): Promise<RpcTypes.Segment | undefined> {
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
  async RPCFrameVim(componentHandle: number, blendTime: number): Promise<RpcTypes.Segment | undefined> {
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
   * @param elements - Array of node indices to frame
   * @param blendTime - Duration of the camera transition in seconds (non-negative)
   * @returns Promise resolving to camera segment representing the final position
   * @throws {Error} If the component handle is invalid or nodes array is empty
   */
  async RPCFrameElements(
    componentHandle: number,
    elements: number[],
    blendTime: number
  ): Promise<RpcTypes.Segment | undefined> {
    // Validation
    if (!Validation.isComponentHandle(componentHandle)) return
    if (!Validation.areComponentHandles(elements)) return 
    blendTime = Validation.clamp01(blendTime)

    // Run
    if (elements.length < this.batchSize) {
      return await this.safeCall(
        () => this.rpc.RPCFrameElements(componentHandle, elements, blendTime),
        undefined
      )
    } else {
      const box = await this.safeCall(
        () => this.RPCGetAABBForElementsBatched(componentHandle, elements),
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
   * @throws {Error} If the box is invalid (min values must be less than max values)
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
   * @throws {Error} If speed is not positive
   */
  RPCSetCameraSpeed(speed: number) {
    // Validation
    speed = Validation.min0(speed)

    // Run
    this.rpc.RPCSetCameraSpeed(speed)
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
  RPCSetCameraAspectRatio(width: number, height: number): void {
    // Validation
    if (!Validation.isPositiveInteger(width)) return
    if (!Validation.isPositiveInteger(height)) return

    // Run
    this.rpc.RPCSetCameraAspectRatio(width, height)
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
      () => this.rpc.RPCLoadVimURL(source.url, source.authToken ?? ""),
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
   * @returns Promise resolving to hit test result if something was hit, undefined otherwise
   */
  async RPCPerformHitTest(pos: RpcTypes.Vector2): Promise<RpcTypes.HitCheckResult | undefined> {
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
   * @throws {Error} If mouseButton is not a valid positive integer
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
   * @throws {Error} If mouseButton is not a valid positive integer
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
   * @throws {Error} If the material handle is invalid or smoothness is out of range
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
