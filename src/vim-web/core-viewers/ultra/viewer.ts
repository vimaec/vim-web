import type { ISimpleEvent } from '../shared/events'
import {type IInputHandler} from '../shared'
import {type InputHandler} from '../shared/input/inputHandler'
import { Camera, IUltraCamera } from './camera'
import { ColorManager } from './colorManager'
import { Decoder, IUltraDecoder } from './decoder'
import { DecoderWithWorker } from './decoderWithWorker'
import { ultraInputAdapter } from './inputAdapter'
import { type IUltraLoadRequest, LoadRequest } from './loadRequest'
import { defaultLogger, ILogger } from '../shared/logger'
import { IUltraRaycaster, Raycaster } from './raycaster'
import { IUltraRenderer, Renderer } from './renderer'
import { RpcClient } from './rpcClient'
import { RpcSafeClient, VimSource } from './rpcSafeClient'
import { SectionBox, type IUltraSectionBox } from './sectionBox'
import { createSelection, IUltraSelection } from './selection'
import { ClientError, ClientState, ConnectionSettings, SocketClient } from './socketClient'
import { IUltraViewport, Viewport } from './viewport'
import { Vim, type IUltraVim } from './vim'
import { VimCollection } from '../shared/vimCollection'

export const INVALID_HANDLE = 0xffffffff

/**
 * Public interface for the Ultra viewer.
 * Consumers should use this instead of the concrete class.
 */
export interface IUltraViewer {
  readonly type: 'ultra'
  readonly camera: IUltraCamera
  readonly inputs: IInputHandler
  readonly vims: IUltraVim[]
  readonly viewport: IUltraViewport
  readonly renderer: IUltraRenderer
  readonly decoder: IUltraDecoder
  readonly raycaster: IUltraRaycaster
  readonly selection: IUltraSelection
  readonly serverUrl: string | undefined
  readonly onStateChanged: ISimpleEvent<ClientState>
  readonly connectionState: ClientState
  readonly sectionBox: IUltraSectionBox
  connect (settings?: ConnectionSettings): Promise<boolean>
  disconnect (): void
  load (source: VimSource): IUltraLoadRequest
  unload (vim: IUltraVim): void
  clear (): void
  dispose (): void
}

/**
 * The main UltraViewer class responsible for managing VIM files,
 * handling connections, and coordinating various components like the camera, decoder, and inputs.
 */
export class UltraViewer implements IUltraViewer {
  /**
   * The type of the viewer, indicating it is a WebGL viewer.
   * Useful for distinguishing between different viewer types in a multi-viewer application.
   */
  public readonly type = 'ultra'
  
  private readonly _decoder: Decoder | DecoderWithWorker
  private readonly _socketClient: SocketClient
  private readonly _input: InputHandler
  private readonly _logger: ILogger
  private readonly _canvas: HTMLCanvasElement
  private readonly _renderer : Renderer
  private readonly _viewport: Viewport
  private readonly _camera: Camera
  private readonly _selection: IUltraSelection
  private readonly _raycaster: Raycaster
  private readonly _vims : VimCollection<Vim>
  private _disposed = false

  // API components
  /**
   * The camera API for controlling camera movements and settings.
   */
  get camera (): IUltraCamera {
    return this._camera
  }

  /**
   * The RPC client for making remote procedure calls.
   * @internal
   */
  readonly rpc: RpcSafeClient

  /**
   * The input API for handling user input events.
   */
  get inputs (): IInputHandler {
    return this._input
  }

  get vims (): IUltraVim[] {
    return this._vims.getAll()
  }

  /**
   * The viewport API for managing the rendering viewport.
   */
  get viewport (): IUltraViewport {
    return this._viewport
  }

  get renderer (): IUltraRenderer {
    return this._renderer
  }

  get decoder (): IUltraDecoder {
    return this._decoder
  }

  get raycaster (): IUltraRaycaster {
    return this._raycaster
  }

  get selection (): IUltraSelection {
    return this._selection
  }

  private readonly _colors: ColorManager

  /**
   * Gets the current URL to which the viewer is connected.
   * @returns The URL as a string, or undefined if not connected.
   */
  get serverUrl (): string | undefined {
    return this._socketClient.url
  }

  /**
   * Event that is triggered when the viewer's connection status changes.
   * @returns An event that emits the current ClientStatus.
   */
  get onStateChanged (): ISimpleEvent<ClientState> {
    return this._socketClient.onStatusUpdate
  }

  /**
   * Gets the current connection status of the viewer.
   * @returns The current ClientStatus.
   */
  get connectionState (): ClientState {
    return this._socketClient.state
  }

  private readonly _sectionBox: SectionBox

  /**
   * The section box API for controlling the section box.
   */
  get sectionBox (): IUltraSectionBox {
    return this._sectionBox
  }

  /**
   * Creates an UltraViewer instance with a new canvas element appended to the given parent element.
   * @param parent - The parent HTML element to which the canvas will be appended.
   * @param logger - Optional logger for logging messages.
   * @returns A new instance of the UltraViewer class.
   */
  static createWithCanvas (parent: HTMLElement, logger?: ILogger): UltraViewer {
    const canvas = document.createElement('canvas')
    parent.appendChild(canvas)
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    const uv = new UltraViewer(canvas, logger)
    return uv
  }

  /**
   * Constructs a new UltraViewer instance.
   * @param canvas - The HTML canvas element for rendering.
   * @param logger - Optional logger for logging messages.
   */
  constructor (canvas: HTMLCanvasElement, logger?: ILogger) {
    this._logger = logger ?? defaultLogger
    this._socketClient = new SocketClient(this._logger, () => this.validateConnection())

    this.rpc = new RpcSafeClient(new RpcClient(this._socketClient))

    this._canvas = canvas
    this._vims = new VimCollection<Vim>()
    
    this._viewport = new Viewport(canvas, this.rpc, this._logger)
    this._decoder = new Decoder(canvas, this._logger)
    this._selection = createSelection()
    this._renderer = new Renderer(this.rpc, this._logger)
    this._colors = new ColorManager(this.rpc)
    this._camera = new Camera(this.rpc)
    this._raycaster = new Raycaster(this.rpc, this._vims)
    this._input = ultraInputAdapter(this)

    this._sectionBox = new SectionBox(this.rpc)

    // Set up the video frame handler
    this._socketClient.onVideoFrame = (msg) => this._decoder.enqueue(msg)
    this._socketClient.onCameraPose = (pose) => this._camera.onCameraPose(pose)

    // Subscribe to status updates
    this._socketClient.onStatusUpdate.subscribe((state) => {
      if (state.status === 'disconnected') {
        this.onDisconnect()
      } else if (state.status === 'connected') {
        this.onConnect()
      }
      if (state.status === 'error') {
        this.onDisconnect()
      }
    })
    window.onbeforeunload = () => this.dispose()
  }

  /**
   * Handles connection logic when the viewer connects to the server.
   * Initializes components and checks for API version compatibility.
   */
  private async onConnect (): Promise<void> {
    this._renderer.onConnect()
    this._input.init()
    this._camera.onConnect()
    
    this._vims.getAll().forEach((vim) => vim.connect())
    this._sectionBox.onConnect() //needs to be called after vims are connected

    this._viewport.update()
    this._decoder.start()
  }

  private async validateConnection (): Promise<ClientError | undefined> {
    const apiVersionError = await this.checkAPIVersion()
    if(apiVersionError) return apiVersionError

    const streamError = await this._renderer.validateConnection()
    if(streamError) return streamError

    return undefined
  }

  private async checkAPIVersion (): Promise<ClientError | undefined> {
    const version = await this.rpc.RPCGetAPIVersion()
    const localVersion = this.rpc.API_VERSION

    const parseVersion = (v: string) => {
      const [major, minor, patch] = v.split('.').map(Number)
      return { major, minor, patch }
    }

    const remoteVersion = parseVersion(version)
    const localParsedVersion = parseVersion(localVersion)

    if (localParsedVersion.major !== remoteVersion.major) {
      this._logger.error('Major version mismatch', { local: localParsedVersion, remote: remoteVersion })
      return {
        status: 'error',
        error: 'compatibility',
        serverUrl: this._socketClient.url ?? '',
        clientVersion: localVersion,
        serverVersion: version
      }
    }

    this._logger.log('API version check passed', { local: localParsedVersion, remote: remoteVersion })
    return undefined
  }

  /**
   * Handles disconnection logic when the viewer disconnects from the server.
   * Cleans up resources and stops tracking.
   */
  private onDisconnect (): void {
    this._decoder.stop()
    this._decoder.clear()
    this._colors.clear()
    this._vims.getAll().forEach((vim) => vim.disconnect())
  }

  /**
   * Connects to a VIM Ultra server.
   * @param url - The server URL to connect to. Defaults to 'ws://localhost:8123'.
   * @returns A promise that resolves when the connection is established.
   */
  async connect (settings?: ConnectionSettings): Promise<boolean> {
    return this._socketClient.connect(settings)
  }

  /**
   * Disconnects from the current VIM Ultra server.
   */
  disconnect (): void {
    this._socketClient.disconnect()
  }

  /**
   * Requests the server to load the given URL or file path.
   * @param source - The path or URL to the VIM file.
   * @returns A load request object that can be used to wait for the load to complete.
   */
  load (source: VimSource): IUltraLoadRequest {
    if (typeof source.url !== 'string' || source.url.trim() === '') {
      const request = new LoadRequest()
      request.error('loadingError', 'Invalid path')
      return request
    }

    const vimIndex = this._vims.allocateId()
    if (vimIndex === undefined) {
      const request = new LoadRequest()
      request.error('loadingError', 'Maximum vim capacity reached')
      return request
    }

    const vim = new Vim(vimIndex, this.rpc, this._colors, this._renderer, source, this._logger)
    this._vims.add(vim)
    const request = vim.connect()
    request.getResult().then((result) => {
      if (result.isError) {
        this._vims.remove(vim)
      }
    })
    return request
  }

  /**
   * Unloads the given VIM from the viewer.
   * @param vim - The VIM instance to unload.
   */
  unload (vim: IUltraVim): void {
    this._vims.remove(vim as Vim)
    vim.disconnect()
  }

  /**
   * Clears all loaded VIMs from the viewer.
   */
  clear (): void {
    this._vims.getAll().forEach((vim) => vim.disconnect())
    this._vims.clear()
  }

  /**
   * Disposes all resources used by the viewer and disconnects from the server.
   */
  dispose (): void {
    if (this._disposed) return
    this._disposed = true
    this.disconnect()
    this._socketClient.dispose()
    this._viewport.dispose()
    this._decoder.dispose()
    this._input.dispose()
    this._sectionBox.dispose()
    this._canvas.remove()
    window.onbeforeunload = null
  }
}

/**
 * Creates a new Ultra viewer with a canvas appended to the given parent element.
 * @param parent - The parent HTML element to which the canvas will be appended.
 * @param logger - Optional logger for logging messages.
 * @returns A new Ultra viewer.
 */
export function createCoreUltraViewer (parent: HTMLElement, logger?: ILogger): IUltraViewer {
  return UltraViewer.createWithCanvas(parent, logger)
}
