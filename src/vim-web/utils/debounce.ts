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