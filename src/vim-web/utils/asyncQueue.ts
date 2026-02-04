/**
 * A queue that converts push-based callbacks into an async iterator.
 * Use this to bridge callback-based APIs with async/await consumers.
 */
export class AsyncQueue<T> {
  private _queue: T[] = []
  private _waiters: ((value: T | undefined) => void)[] = []
  private _closed = false

  /** Push a value to the queue. Wakes up one waiting consumer. */
  push (value: T): void {
    if (this._closed) return
    if (this._waiters.length > 0) {
      this._waiters.shift()!(value)
    } else {
      this._queue.push(value)
    }
  }

  /** Close the queue. No more values can be pushed. */
  close (): void {
    this._closed = true
    // Wake up all waiters with undefined to signal end
    this._waiters.forEach(w => w(undefined))
    this._waiters = []
  }

  /** Async iterator that yields queued values until closed. */
  async * [Symbol.asyncIterator] (): AsyncGenerator<T, void, void> {
    while (true) {
      if (this._queue.length > 0) {
        yield this._queue.shift()!
      } else if (this._closed) {
        return
      } else {
        const value = await new Promise<T | undefined>(resolve => this._waiters.push(resolve))
        if (value === undefined) return // Queue was closed
        yield value
      }
    }
  }
}
