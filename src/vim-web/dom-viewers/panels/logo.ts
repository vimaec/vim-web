import logoImage from '../../assets/logo.png'

export type LogoHandle = {
  el: HTMLDivElement
  destroy (): void
}

export type LogoOptions = {
  /** `capacity.canFollowUrl`: with it off the mark is shown but does not lead anywhere. */
  canFollowUrl: boolean
}

/** The VIM logo, top-left, linking to vimaec.com where the host allows it. */
export function logo (host: HTMLElement, opts: LogoOptions): LogoHandle {
  const el = document.createElement('div')
  el.className = 'vim-ds-logo'
  const img = document.createElement('img')
  img.className = 'vim-ds-logo__img'
  img.src = logoImage
  img.alt = 'VIM'
  if (opts.canFollowUrl) {
    const link = document.createElement('a')
    link.href = 'https://vimaec.com'
    link.appendChild(img)
    el.appendChild(link)
  } else {
    el.appendChild(img)
  }
  host.appendChild(el)
  return { el, destroy: () => el.remove() }
}
