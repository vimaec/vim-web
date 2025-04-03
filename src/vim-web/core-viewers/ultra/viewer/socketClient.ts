import { StreamLogger } from './streamLogger'
import * as Protocol from './protocol'
import { Marshal, ReadMarshal } from './marshal'
import { ILogger } from './logger'
import { ControllablePromise, IPromise, ResolvedPromise } from '../../utils/promise'
import { SimpleEventDispatcher } from 'ste-simple-events'
import { isWebSocketUrl } from '../../utils/url'
import { Segment } from '../../utils/math3d'

export const DEFAULT_LOCAL_ULTRA_SERVER_URL = 'ws://localhost:8123'

export type UltraConnectionSettings = {
  url?: string
  retries? : number
  timeout?: number
  retryDelay?: number
}

export type UltraClientState = ClientStateConnecting | ClientStateConnected | ClientStateDisconnected | ClientStateValidating | UltraClientError
export type UltraClientError = ClientStateCompatibilityError | ClientStateConnectionError | ClientStreamError// | other types of errors

export type ClientStateConnecting = {
  status: 'connecting'
}
export type ClientStateValidating = {
  status: 'validating'
}
export type ClientStateConnected = {
  status: 'connected'
}
export type ClientStateDisconnected = {
  status: 'disconnected'
}
export type ClientStateCompatibilityError = {
  status: 'error'
  error: 'compatibility'
  serverUrl: string
  serverVersion: string
  clientVersion: string
}

export type ClientStateConnectionError = {
  status: 'error'
  error: 'connection'
  serverUrl: string
}

export type ClientStreamError = {
  status: 'error'
  error: 'stream'
  serverUrl: string
  details: string
}

export enum FrameType {
  // eslint-disable-next-line no-unused-vars
  VideoKeyFrame = 0,
  // eslint-disable-next-line no-unused-vars
  VideoDeltaFrame = 1,
  // eslint-disable-next-line no-unused-vars
  Disconnection = 2,
  // eslint-disable-next-line no-unused-vars
  RPCResponse = 255,
  // eslint-disable-next-line no-unused-vars
  CameraPose = 254
}

/**
 * Messenger class responsible for handling WebSocket communication,
 * including sending and receiving messages, managing connection state,
 * and dispatching events.
 */
export class SocketClient {
  private readonly _streamLogger: StreamLogger
  private readonly _logger: ILogger

  private _socket: WebSocket | undefined

  private readonly _pendingRPCs = new Map<number, { resolve:(data: ReadMarshal) => void, reject: (error: any) => void }>()
  private _rpcCallId: number = 0
  private _reconnectTimeout : ReturnType<typeof setTimeout> | undefined
  private _connectionTimeout: ReturnType<typeof setTimeout> | undefined

  private _validateConnection: () => Promise<UltraClientError | undefined>
  /**
   * Callback function to handle incoming video frames.
   * @param msg - The video frame message received from the server.
   */
  public onVideoFrame: (msg: Protocol.VideoFrameMessage) => void = () => { }
  public onCameraPose: (msg: Segment) => void = () => { }

  private _state: UltraClientState = { status: 'disconnected' }
  private _onStatusUpdate = new SimpleEventDispatcher<UltraClientState>()
  private _connectPromise: IPromise<boolean> = new ResolvedPromise<boolean>(undefined)
  private _connectionSettings: UltraConnectionSettings

  /**
   * Event that is triggered when the connection status updates.
   * @returns An event dispatcher for connection status updates.
   */
  public get onStatusUpdate () {
    return this._onStatusUpdate.asEvent()
  }

  /**
   * Gets the current connection status.
   * @returns The current ClientStatus.
   */
  public get state (): UltraClientState {
    return this._state
  }

  /**
   * Updates the connection state and dispatches the status update event.
   * @param state - The new connection state.
   */
  private updateState (state: UltraClientState): void {
    this._state = state
    this._onStatusUpdate.dispatch(state)
  }



  /**
   * Gets the URL to which the messenger is currently connecting or connected.
   * @returns The WebSocket URL as a string, or undefined if not set.
   */
  public get url (): string | undefined {
    return this._connectionSettings?.url
  }

  /**
   * Constructs a new Messenger instance.
   * @param logger - The logger for logging messages.
   * @param checks - checks to perform before returning connection.
   */
  constructor (logger: ILogger, validateConnection: () => Promise<UltraClientError | undefined>) {
    this._logger = logger
    this._rpcCallId = 0
    this._streamLogger = new StreamLogger(logger)
    this._validateConnection = validateConnection
  }

  /**
   * Connects to a WebSocket server at the specified URL.
   * @param url - The WebSocket URL to connect to.
   * @returns A promise that resolves when the connection is established.
   */
  public connect (settings: UltraConnectionSettings): Promise<boolean> {
    settings = {
      url: settings?.url ?? DEFAULT_LOCAL_ULTRA_SERVER_URL,
      retries: settings?.retries ?? -1,
      timeout : settings?.timeout ?? 5000,
      retryDelay: settings?.retryDelay ?? 5000
    }

    const url = settings.url
    if (!isWebSocketUrl(url)) {
      this._disconnect({ status: 'error', error: 'connection', serverUrl: url })
      return Promise.reject(new Error(`Invalid WebSocket URL: ${url}`))
    }
    
    if (this._socket) {
      if (this._connectionSettings.url === url) {
        // Return existing connection promise if the URL is the same
        return this._connectPromise.promise
      } else {
        // Disconnect if the URL is different
        this._clearSocket()
        this._connectionSettings = undefined
        this._connectPromise.reject('Connection to a different server')
      }
    }

    // Only create a new promise if the URL is different
    if(this.url !== url){
      this._connectPromise = new ControllablePromise<boolean>()
      this._connectionSettings = settings
    }

    // Update state and attempt to connect
    this.updateState({ status: 'connecting' })
    try {
      this._socket = new WebSocket(url)
      this._connectionTimeout = setTimeout(() => this._onClose(), settings.timeout)
      this._socket.onopen = (e) => { this._onOpen(e) }
      this._socket.onclose = (e) => { this._onClose(e) }
      this._socket.onerror = (e) => { this._onClose(e) }
      this._socket.onmessage = async (e) => { await this.onMessage(e) }
    } catch (e) {
      this._logger.error('Error opening socket: ', e)
      this._onClose()
    }

    return this._connectPromise.promise
  }

  /**
   * Disconnects from the current WebSocket server.
   */
  public disconnect (error?: UltraClientError): void {
    this._logger.log('Disconnecting from: ', this.url)
    this._connectionSettings = undefined
    this._disconnect(error)
  }

  /**
   * Handles the disconnection logic, stopping logging and clearing the socket.
   */
  private _disconnect (error?: UltraClientError): void {
    this._logger.log('disconnect', error)
    clearTimeout(this._reconnectTimeout)
    clearTimeout(this._connectionTimeout)
    this._streamLogger.stopLogging()
    this._clearSocket()
    this._clearPendingRPCs()
    this.updateState(error ?? { status: 'disconnected' })
  }

  /**
   * Clears the WebSocket event handlers and closes the connection if open.
   */
  private _clearSocket (): void {
    if (this._socket === undefined) return

    this._socket.onopen = () => { }
    this._socket.onclose = () => { }
    this._socket.onerror = () => { }
    this._socket.onmessage = () => { }
    if (this._socket.readyState === WebSocket.OPEN) {
      this._socket.close()
    }
    this._socket = undefined
  }

  /**
   * Handles incoming messages from the WebSocket server.
   * @param event - The message event containing the data.
   */
  public async onMessage (event: MessageEvent): Promise<void> {
    const msg = await Protocol.readBlob(event.data as Blob)

    switch (msg.header.frameType) {
      case FrameType.Disconnection:
        this._logger.log('Server Disconnected (User Timeout)')
        this.disconnect()
        return

      case FrameType.RPCResponse:
        this.handleRPCResponse(msg.dataBuffer)
        return

      case FrameType.CameraPose:
        const m = new ReadMarshal(msg.dataBuffer)
        if(this.onCameraPose){
          this.onCameraPose(m.readSegment())
        }
        return

      case FrameType.VideoKeyFrame:
      case FrameType.VideoDeltaFrame:
        this.onVideoFrame(msg)
        this._streamLogger.onFrame(msg)
        break
    }
  }

  /**
   * Handles RPC responses received from the server.
   * @param buffer - The ArrayBuffer containing the response data.
   */
  private handleRPCResponse (buffer: ArrayBuffer): void {
    const m = new ReadMarshal(buffer)
    const callId = m.readUInt()
    // Check if the callId exists in the map
    const pendingRPC = this._pendingRPCs.get(callId)
    if (pendingRPC !== undefined) {
      // If it exists, resolve the associated promise with the response data
      pendingRPC.resolve(m)
      // Remove the entry from the map as the RPC call has been handled
      this._pendingRPCs.delete(callId)
    } else {
      // If the callId is not found, it means the RPC call was not pending or has already been handled
      // You can log a warning or handle it according to your application's logic
      this._logger.log(`Received response for non-pending or already handled RPC call with callId ${callId}`)
    }
  }

  /**
   * Handler for WebSocket 'open' event.
   * @param _ - The event object (unused).
   */
  private async _onOpen (_: Event): Promise<void> {
    // Clear connection timeout
    clearTimeout(this._connectionTimeout)
    this.updateState({ status: 'validating' })

    // Validate connection
    const issues = await this._validateConnection()
    if (issues !== undefined) {
      this._disconnect(issues)
      return
    }

    // Connection is valid resolve the connect promise
    this._logger.log('Connected to: ', this._socket?.url)
    this.updateState({ status: 'connected' })
    this._streamLogger.startLoggging()
    this._connectPromise.resolve(true)
  }

  /**
   * Handler for WebSocket 'close' event.
   * @param _event - The event object.
   */
  private _onClose (_event?: Event): void {
    const connecting = this.state.status === 'connecting' || this.state.status === 'validating'
    this._logger.log('WebSocket closed.')
    clearTimeout(this._connectionTimeout)
    this._disconnect({ status: 'error', error: 'connection', serverUrl: this.url })

    if(connecting && this._connectionSettings.retries === 0){
      this._logger.log('No more retries left')
      this._connectPromise.resolve(false)
      return
    }

    // Retry connection as long as there are retries left
    this._logger.log('Attempting to reconnect in 5 seconds')
    this._reconnectTimeout = setTimeout(() => {
      this.updateState({ status: 'connecting' })
      if(connecting){
        // Retries only apply in the connecting state
        this._connectionSettings.retries--
      }
      this.connect(this._connectionSettings)
    }, this._connectionSettings.retryDelay)
  }

  /**
   * Sends binary data over the WebSocket connection.
   * @param data - The ArrayBuffer containing the binary data to send.
   */
  public sendBinary (data: ArrayBuffer): void {
    switch (this.state.status){
      case 'validating':
      case 'connected':
        this._socket?.send(data)
        return
      case 'disconnected':
        this._logger.log('Cannot send data when disconnected')
        return
      case 'connecting':
        this._logger.log('Cannot send data when connecting')
        return
      case 'error':
        this._logger.log('Cannot send data when in error state')
        return
    }
  }

  /**
   * Sends an RPC request and waits for a response.
   * @param marshal - The Marshal containing the request data.
   * @returns A promise that resolves with the response data.
   */
  public async sendRPCWithReturn (marshal: Marshal): Promise<ReadMarshal> {
    // Create a promise for the RPC call
    const promise = new Promise<ReadMarshal>((resolve, reject) => {
      // Store the promise handlers along with the callId in the pendingRPCs map
      const callId = this._rpcCallId++
      this._rpcCallId = (this._rpcCallId % Number.MAX_SAFE_INTEGER)

      this._pendingRPCs.set(callId, { resolve, reject })

      // Write the callId to the message and send it
      marshal.writeUInt(callId)
      this.sendBinary(marshal.getBuffer())
    })

    // Return the promise to the caller
    return await promise
  }

  /**
   * Sends an RPC request without expecting a response.
   * @param marshal - The Marshal containing the request data.
   */
  public sendRPC (marshal: Marshal): void {
    const callId = 0xffffffff

    // Write the callId to the message and send it
    marshal.writeUInt(callId)
    this.sendBinary(marshal.getBuffer())
  }

  private _clearPendingRPCs (): void {
    for (const pendingRPC of this._pendingRPCs.values()) {
      pendingRPC.reject('Connection closed')
    }
    this._pendingRPCs.clear()
  }

  /**
   * Disposes of the messenger, cleaning up resources and event handlers.
   */
  public dispose (): void {
    this.disconnect()
    this._onStatusUpdate.clear()
    this.onVideoFrame = () => { }
  }
}
