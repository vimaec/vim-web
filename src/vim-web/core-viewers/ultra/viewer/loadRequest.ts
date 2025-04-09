import { Vim } from './vim'
import * as Utils from '../../../utils'

export type LoadRequestResult = LoadSuccess | LoadError

export class LoadSuccess {
  readonly isError = false
  readonly isSuccess = true
  readonly vim: Vim
  constructor (vim: Vim) {
    this.vim = vim
  }
}

export class LoadError {
  readonly isError = true
  readonly isSuccess = false
  readonly type: VimRequestErrorType
  readonly details: string | undefined
  constructor (public error: VimRequestErrorType, details?: string) {
    this.type = error
    this.details = details
  }
}

export interface ILoadRequest {
  get isCompleted(): boolean;
  getProgress(): AsyncGenerator<number>;
  getResult(): Promise<LoadError | LoadSuccess>;
  abort(): void;
}

export type VimRequestErrorType = 'loadingError' | 'downloadingError' | 'serverDisconnected' | 'unknown' | 'cancelled'

export class LoadRequest implements ILoadRequest {
  private _progress : number = 0
  private _progressPromise = new Utils.ControllablePromise<void>()

  private _completionPromise = new Utils.ControllablePromise<void>()
  private _result : LoadError | LoadSuccess | undefined

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

  async getResult () : Promise<LoadError | LoadSuccess> {
    await this._completionPromise.promise
    return this._result
  }

  onProgress (progress: number) {
    this._progress = progress
    this._progressPromise.resolve()
    this._progressPromise = new Utils.ControllablePromise<void>()
  }

  success (vim: Vim) {
    this._result = new LoadSuccess(vim)
    this._progress = 1
    this._progressPromise.resolve()
    this._completionPromise.resolve()
    return this
  }

  error (error: VimRequestErrorType, details?: string) {
    this._result = new LoadError(error, details)
    this._progress = 1
    this._progressPromise.resolve()
    this._completionPromise.resolve()
    return this
  }

  abort () {
    this.error('cancelled')
  }
}
