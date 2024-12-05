import type { VideoFrameMessage } from './protocol'
import { ILogger } from './logger'

export class StreamLogger {
  private readonly _logger: ILogger
  private _frameCount: number = 0
  private _dataLengthSum: number = 0
  private _id: ReturnType<typeof setInterval> | undefined

  constructor (logger: ILogger) {
    this._logger = logger
  }

  /**
   * Starts logging the stream metrics.
   */
  startLoggging (): void {
    this._id = setInterval(() => { this.logMetrics() }, 5000)
  }

  /**
   * Stops logging the stream metrics.
   */
  stopLogging (): void {
    clearInterval(this._id)
    this._id = undefined
  }

  onFrame (frameMsg: VideoFrameMessage): void {
    this._frameCount++
    this._dataLengthSum += frameMsg.header.dataLength
  }

  private logMetrics (): void {
    const avgDataRatePS = this._dataLengthSum / 1024
    const avgDataRatePF = this._dataLengthSum / this._frameCount / 1024
    const avgFrameRate = this._frameCount

    this._logger.log(
`
Video Stream Metrics: \n
Average Frame Size: ${avgDataRatePF} kb \n
Average Frame/Second ${avgFrameRate} \n
Averrage Date/Second ${avgDataRatePS} kb
`
    )

    // Reset counters
    this._frameCount = 0
    this._dataLengthSum = 0
  }
}
