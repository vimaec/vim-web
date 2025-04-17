
import { ISignal, SignalDispatcher } from 'ste-signals';

export function debounce<T extends (...args: any[]) => void>(func: T, delay: number): [(...args: Parameters<T>) => void, () => void] {
  let timeoutId: ReturnType<typeof setTimeout>;
  return [function(...args: Parameters<T>) {
      if (timeoutId) {
          clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
          func(...args);
      }, delay);
  }, () => clearTimeout(timeoutId)]
}


/**
 * A debounced signal that dispatches at most once per animation frame.
 */
export class DebouncedSignal {
  private _dispatcher = new SignalDispatcher();
  private _frameRequestId: number | undefined;

  /**
   * Indicates whether a dispatch is currently scheduled.
   * 
   * @returns `true` if a dispatch is scheduled; otherwise `false`.
   */
  get isScheduled(): boolean {
    return this._frameRequestId !== undefined;
  }

  /**
   * Returns the signal interface that subscribers can listen to.
   * 
   * @returns An `ISignal` that is dispatched once per frame when requested.
   */
  get signal(): ISignal {
    return this._dispatcher.asEvent();
  }

  /**
   * Schedules the signal to be dispatched on the next animation frame.
   * Has no effect if a dispatch is already scheduled.
   */
  requestDispatch(): void {
    if (this._frameRequestId !== undefined) return;

    this._frameRequestId = requestAnimationFrame(() => {
      this._dispatcher.dispatch();
      this._frameRequestId = undefined;
    });
  }

  /**
   * Cancels a scheduled signal dispatch if one exists.
   */
  cancel(): void {
    if (this._frameRequestId !== undefined) {
      cancelAnimationFrame(this._frameRequestId);
      this._frameRequestId = undefined;
    }
  }
}
