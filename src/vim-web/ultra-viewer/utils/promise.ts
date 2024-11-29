
export interface IPromise<T>{
  promise: Promise<T>
  resolve(value: T): void
  reject(reason?: string): void
}

export class ControllablePromise<T> implements IPromise<T>{
  private _resolve: ((value: T) => void) | undefined
  private _reject: ((reason?: string) => void) | undefined
  private _promise: Promise<T>;

  constructor() {
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  get promise() {
    return this._promise
  }

  resolve(value: T) {
    this._resolve?.(value)
  }

  reject(reason?: string) {
    this._reject?.(reason)
  }
}

export class ResolvedPromise<T> implements IPromise<T>{
  private _value: T
  constructor(value: T){
    this._value = value
  }

  get promise() {
    return Promise.resolve(this._value)
  }

  resolve(_: T) {
    // Do nothing
    }

  reject(_?: string) {
    // Do nothing
  }
}