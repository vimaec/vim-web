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

export type LoadResult<T> = ILoadSuccess<T> | ILoadError

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
