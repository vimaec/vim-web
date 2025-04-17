// loader
import {
  VimPartialSettings
} from '../vimSettings'

import { Vim } from '../vim'
import { Result, ErrorResult, SuccessResult } from '../../../../utils/result'
import { open } from './open'

import { VimSource } from '../..'
import {
  BFast, IProgressLogs
} from 'vim-format'
import { ControllablePromise } from '../../../../utils/promise'

export type RequestSource = {
  url?: string,
  buffer?: ArrayBuffer,
  headers?: Record<string, string>,
}

/**
 * Initiates a request to load a VIM object from a given source.
 * @param options a url where to find the vim file or a buffer of a vim file.
 * @param settings the settings to configure how the vim will be loaded.
 * @returns a request object that can be used to track progress and get the result.
 */
export function requestVim (options: RequestSource, settings? : VimPartialSettings) {
  return new VimRequest(options, settings)
}

/**
 * A class that represents a request to load a VIM object from a given source.
 */
export class VimRequest {
  private _source: VimSource
  private _settings : VimPartialSettings
  private _bfast : BFast

  // Result states
  private _isDone: boolean = false
  private _vimResult?: Vim
  private _error?: string

  // Promises to await progress updates and completion
  private _progress : IProgressLogs = { loaded: 0, total: 0, all: new Map() }
  private _progressPromise = new ControllablePromise<IProgressLogs>()
  private _completionPromise = new ControllablePromise<void>()

  constructor (source: VimSource, settings: VimPartialSettings) {
    this._source = source
    this._settings = settings

    this.startRequest()
  }

  /**
   * Initiates the asynchronous request and handles progress updates.
   */
  private async startRequest () {
    try {
      this._bfast = new BFast(this._source)

      const vim: Vim = await open(this._bfast, this._settings, (progress: IProgressLogs) => {
        this._progress = progress
        this._progressPromise.resolve(progress)
        this._progressPromise = new ControllablePromise<IProgressLogs>()
      })
      this._vimResult = vim
    } catch (err: any) {
      this._error = err.message ?? JSON.stringify(err)
      console.error('Error loading VIM:', err)
    } finally {
      this.end()
    }
  }

  private end () {
    this._isDone = true
    this._progressPromise.resolve(this._progress)
    this._completionPromise.resolve()
  }

  async getResult (): Promise<Result<Vim>> {
    await this._completionPromise
    return this._error ? new ErrorResult(this._error) : new SuccessResult(this._vimResult)
  }

  /**
   * Async generator that yields progress updates.
   * @returns An AsyncGenerator yielding IProgressLogs.
   */
  async * getProgress (): AsyncGenerator<IProgressLogs, void, void> {
    while (!this._isDone) {
      yield await this._progressPromise.promise
    }
  }

  abort () {
    this._bfast.abort()
    this._error = 'Request aborted'
    this.end()
  }
}
