import { Vim, type IUltraVim } from './vim'
import {
  LoadRequest as BaseLoadRequest,
  ILoadRequest as BaseILoadRequest,
  ILoadError,
  IProgress,
  LoadSuccess,
  LoadError as SharedLoadError
} from '../shared/loadResult'

export type VimRequestErrorType = 'loadingError' | 'downloadingError' | 'serverDisconnected' | 'unknown' | 'cancelled'

export interface IUltraLoadError extends ILoadError {
  readonly type: VimRequestErrorType
}

/** @internal */
export class LoadError extends SharedLoadError implements IUltraLoadError {
  readonly type: VimRequestErrorType
  constructor (error: VimRequestErrorType, details?: string) {
    super(error, details)
    this.type = error
  }
}

export type IUltraLoadRequest = BaseILoadRequest<IUltraVim, IUltraLoadError>

/** @internal */
export class LoadRequest extends BaseLoadRequest<Vim, LoadError> {
  onProgress (progress: IProgress) {
    this.pushProgress(progress)
  }

  success (vim: Vim) {
    this.complete(new LoadSuccess(vim))
    return this
  }

  error (error: VimRequestErrorType, details?: string) {
    this.complete(new LoadError(error, details))
    return this
  }

  abort () {
    this.error('cancelled')
  }
}
