import { Vim } from './vim'
import {
  LoadRequest as BaseLoadRequest,
  ILoadRequest as BaseILoadRequest,
  LoadSuccess,
  LoadError as SharedLoadError
} from '../shared/loadResult'

export type VimRequestErrorType = 'loadingError' | 'downloadingError' | 'serverDisconnected' | 'unknown' | 'cancelled'

export class LoadError extends SharedLoadError {
  readonly type: VimRequestErrorType
  constructor (error: VimRequestErrorType, details?: string) {
    super(error, details)
    this.type = error
  }
}

export type ILoadRequest = BaseILoadRequest<Vim, number, LoadError>

export class LoadRequest extends BaseLoadRequest<Vim, number, LoadError> {
  onProgress (progress: number) {
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
