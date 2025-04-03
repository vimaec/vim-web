import { UltraVim } from './ultraVim'
import { ControllablePromise } from '../../utils/promise'

export type UltraLoadRequestResult = UltraLoadSuccess | UltraLoadError

export class UltraLoadSuccess {
  readonly isError = false
  readonly isSuccess = true
  readonly vim: UltraVim
  constructor (vim: UltraVim) {
    this.vim = vim
  }
}

export class UltraLoadError {
  readonly isError = true
  readonly isSuccess = false
  readonly type: UltraVimRequestErrorType
  readonly details: string | undefined
  constructor (public error: UltraVimRequestErrorType, details?: string) {
    this.type = error
    this.details = details
  }
}

export interface UltraILoadRequest {
  get isCompleted(): boolean;
  getProgress(): AsyncGenerator<number>;
  getResult(): Promise<UltraLoadError | UltraLoadSuccess>;
  abort(): void;
}

export type UltraVimRequestErrorType = 'loadingError' | 'downloadingError' | 'serverDisconnected' | 'unknown' | 'cancelled'

export class UltraLoadRequest implements UltraILoadRequest {
  private _progress : number = 0
  private _progressPromise = new ControllablePromise<void>()

  private _completionPromise = new ControllablePromise<void>()
  private _result : UltraLoadError | UltraLoadSuccess | undefined

  get isCompleted () {
    return this._result !== undefined
  }

  async * getProgress () {
    //Always yield 0 initially
    yield 0

    if (this._result !== undefined) {
      yield this._progress
      return
    }

    while (this._result === undefined) {
      await this._progressPromise.promise
      yield this._progress
    }
  }

  async getResult () : Promise<UltraLoadError | UltraLoadSuccess> {
    await this._completionPromise.promise
    return this._result
  }

  onProgress (progress: number) {
    this._progress = progress
    this._progressPromise.resolve()
    this._progressPromise = new ControllablePromise<void>()
  }

  success (vim: UltraVim) {
    this._result = new UltraLoadSuccess(vim)
    this._progress = 1
    this._progressPromise.resolve()
    this._completionPromise.resolve()
    return this
  }

  error (error: UltraVimRequestErrorType, details?: string) {
    this._result = new UltraLoadError(error, details)
    this._progress = 1
    this._progressPromise.resolve()
    this._completionPromise.resolve()
    return this
  }

  abort () {
    this.error('cancelled')
  }
}
