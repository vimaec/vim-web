import helpImage from '../../assets/quick-controls.svg'

export const HELP_TITLE = 'Key navigation controls'

/** The quick-controls help image for the modal body. */
export function renderHelp (body: HTMLElement): { destroy (): void } {
  const img = document.createElement('img')
  img.className = 'vim-ds-help-img'
  img.src = helpImage
  img.alt = HELP_TITLE
  body.appendChild(img)
  return { destroy: () => img.remove() }
}
