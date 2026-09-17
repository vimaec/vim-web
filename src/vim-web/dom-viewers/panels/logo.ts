import logoImage from '../../assets/logo.png'

export type LogoHandle = {
  el: HTMLDivElement
  destroy (): void
}

/** The VIM logo, top-left, linking to vimaec.com. */
export function logo (host: HTMLElement): LogoHandle {
  const el = document.createElement('div')
  el.className = 'vim-ds-logo'
  const link = document.createElement('a')
  link.href = 'https://vimaec.com'
  const img = document.createElement('img')
  img.className = 'vim-ds-logo__img'
  img.src = logoImage
  img.alt = 'VIM'
  link.appendChild(img)
  el.appendChild(link)
  host.appendChild(el)
  return { el, destroy: () => el.remove() }
}
