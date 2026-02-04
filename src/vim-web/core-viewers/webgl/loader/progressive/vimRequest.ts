import { VimPartialSettings } from '../vimSettings'
import { Vim } from '../vim'
import { Result, ErrorResult, SuccessResult } from '../../../../utils/result'
import { AsyncQueue } from '../../../../utils/asyncQueue'
import { open } from './open'
import { VimSource } from '../..'
import { BFast, IProgressLogs } from 'vim-format'

export type RequestSource = {
  url?: string,
  buffer?: ArrayBuffer,
  headers?: Record<string, string>,
}

/**
 * Initiates a request to load a VIM object from a given source.
 * @param options a url where to find the vim file or a buffer of a vim file.
 * @param settings the settings to configure how the vim will be loaded.
 * @param vimIndex the stable ID (0-255) for GPU picking, allocated by the viewer.
 * @returns a request object that can be used to track progress and get the result.
 */
export function requestVim (options: RequestSource, settings: VimPartialSettings, vimIndex: number) {
  return new VimRequest(options, settings, vimIndex)
}

/**
 * A class that represents a request to load a VIM object from a given source.
 */
export class VimRequest {
  private _source: VimSource
  private _settings: VimPartialSettings
  private _vimIndex: number
  private _bfast: BFast

  private _progressQueue = new AsyncQueue<IProgressLogs>()
  private _result: Promise<Result<Vim>>

  constructor (source: VimSource, settings: VimPartialSettings, vimIndex: number) {
    this._source = source
    this._settings = settings
    this._vimIndex = vimIndex
    this._result = this.startRequest()
  }

  private async startRequest (): Promise<Result<Vim>> {
    try {
      this._bfast = new BFast(this._source)
      const vim = await open(this._bfast, this._settings, this._vimIndex, (progress) => {
        this._progressQueue.push(progress)
      })
      this._progressQueue.close()
      return new SuccessResult(vim)
    } catch (err: any) {
      this._progressQueue.close()
      const message = err.message ?? JSON.stringify(err)
      console.error('Error loading VIM:', err)
      return new ErrorResult(message)
    }
  }

  async getResult (): Promise<Result<Vim>> {
    return this._result
  }

  getProgress (): AsyncGenerator<IProgressLogs, void, void> {
    return this._progressQueue[Symbol.asyncIterator]()
  }

  abort (): void {
    this._bfast.abort()
    this._progressQueue.close()
  }
}
