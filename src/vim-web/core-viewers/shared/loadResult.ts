import { AsyncQueue } from '../../utils/asyncQueue'
import { ControllablePromise } from '../../utils/promise'

export interface ILoadSuccess<T> {
  readonly isSuccess: true
  readonly isError: false
  readonly vim: T
}

export interface ILoadError {
  readonly isSuccess: false
  readonly isError: true
  readonly error: string
  readonly details?: string
}

export type ProgressType = 'bytes' | 'percent'

export interface IProgress {
  type: ProgressType
  current: number
  total?: number
}

export type LoadResult<TValue, TError extends ILoadError = ILoadError> = ILoadSuccess<TValue> | TError

export class LoadSuccess<T> implements ILoadSuccess<T> {
  readonly isSuccess = true as const
  readonly isError = false as const
  constructor(readonly vim: T) {}
}

export class LoadError implements ILoadError {
  readonly isSuccess = false as const
  readonly isError = true as const
  constructor(
    readonly error: string,
    readonly details?: string
  ) {}
}

/**
 * Interface for load requests that can be used as a type constraint.
 */
export interface ILoadRequest<TVim, TError extends ILoadError = ILoadError> {
  readonly isCompleted: boolean
  getProgress(): AsyncGenerator<IProgress>
  getResult(): Promise<LoadResult<TVim, TError>>
  getVim(): Promise<TVim>
  abort(): void
}

/**
 * Base class for loading requests that provides progress tracking via AsyncQueue.
 * Both WebGL and Ultra extend this class with their specific loading logic.
 */
export class LoadRequest<TVim, TError extends ILoadError = ILoadError>
  implements ILoadRequest<TVim, TError> {
  private _progressQueue = new AsyncQueue<IProgress>()
  private _result: LoadResult<TVim, TError> | undefined
  private _resultPromise = new ControllablePromise<LoadResult<TVim, TError>>()

  get isCompleted () { return this._result !== undefined }

  async * getProgress (): AsyncGenerator<IProgress> {
    yield * this._progressQueue
  }

  async getResult (): Promise<LoadResult<TVim, TError>> {
    return this._resultPromise.promise
  }

  async getVim (): Promise<TVim> {
    const result = await this.getResult()
    if (result.isSuccess === false) throw new Error(result.error)
    return result.vim
  }

  pushProgress (progress: IProgress) {
    this._progressQueue.push(progress)
  }

  complete (result: LoadResult<TVim, TError>) {
    if (this._result !== undefined) return
    this._result = result
    this._progressQueue.close()
    this._resultPromise.resolve(result)
  }

  abort () {
    this.complete(new LoadError('cancelled') as TError)
  }
}
