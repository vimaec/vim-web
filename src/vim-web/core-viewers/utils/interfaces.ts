interface ForEachable<T> {
  forEach(callback: (value: T) => void): void;
}