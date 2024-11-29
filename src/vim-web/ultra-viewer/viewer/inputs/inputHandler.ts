
export abstract class InputHandler {
  private readonly _disconnect: Array<() => void> = [];

  register(): void { }

  dispose(): void { }

  unregister(): void {
    this._disconnect.forEach(d => { d(); });
    this._disconnect.length = 0;
  }

  // Helper to unregister all event listeners
  protected reg<T extends Event>(
    element: HTMLElement | Window,
    eventType: string,
    callback: (event: T) => void
  ): void {
    const f = (e: Event): void => { callback(e as T); };
    element.addEventListener(eventType, f);
    this._disconnect.push(() => { element.removeEventListener(eventType, f); });
  }
}
