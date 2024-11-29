export class Result<T, E> {
  private constructor(private readonly value: T | undefined, private readonly error: E | undefined) {}

  static ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>(value, undefined);
  }

  static error<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error);
  }

  isOk(): this is Result<T, undefined> {
    return this.error === undefined;
  }

  isError(): this is Result<undefined, string> {
    return this.value === undefined;
  }

  getValue(): T {
    if (this.isError()) {
      throw new Error("Tried to get value from an error result");
    }
    return this.value as T;
  }

  getError(): E {
    if (this.isOk()) {
      throw new Error("Tried to get error from a successful result");
    }
    return this.error as E;
  }
}
