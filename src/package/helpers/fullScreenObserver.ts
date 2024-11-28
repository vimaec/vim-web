
export class FullScreenObserver {
  onFullScreenChange: ((value: boolean) => void) | undefined
  private fullScreen: boolean = this.isFullScreen()
  private timeout: ReturnType<typeof setTimeout>

  constructor () {
    this.loop()
  }

  isFullScreen () {
    return !!document.fullscreenElement
  }

  private loop () {
    this.timeout = setTimeout(() => this.loop(), 250)
    const next = this.isFullScreen()
    if (this.fullScreen !== next) {
      this.onFullScreenChange?.(next)
    }
  }

  dispose () {
    this.onFullScreenChange = undefined
    clearTimeout(this.timeout)
  }
}
