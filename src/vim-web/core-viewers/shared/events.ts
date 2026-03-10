/**
 * A signal with no payload.
 * Subscribe to be notified when the signal fires.
 */
export interface ISignal {
  /** Number of active subscriptions. */
  readonly count: number
  /** Subscribe to the signal. Returns a function that unsubscribes. */
  subscribe(fn: () => void): () => void
  /** Alias for {@link subscribe}. */
  sub(fn: () => void): () => void
  /** Subscribe once — automatically removed after first fire. */
  one(fn: () => void): () => void
  /** Remove a subscription by handler reference. */
  unsubscribe(fn: () => void): void
  /** Check whether a handler is currently subscribed. */
  has(fn: () => void): boolean
  /** Remove all subscriptions. */
  clear(): void
}

/**
 * A signal that carries a payload of type `T`.
 * Subscribers receive the payload as their first argument.
 */
export interface ISimpleEvent<T> {
  /** Number of active subscriptions. */
  readonly count: number
  /** Subscribe to the event. Returns a function that unsubscribes. */
  subscribe(fn: (args: T) => void): () => void
  /** Alias for {@link subscribe}. */
  sub(fn: (args: T) => void): () => void
  /** Subscribe once — automatically removed after first fire. */
  one(fn: (args: T) => void): () => void
  /** Remove a subscription by handler reference. */
  unsubscribe(fn: (args: T) => void): void
  /** Check whether a handler is currently subscribed. */
  has(fn: (args: T) => void): boolean
  /** Remove all subscriptions. */
  clear(): void
}
