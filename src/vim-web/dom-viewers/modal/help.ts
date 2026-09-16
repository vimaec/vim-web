// The asset stays with the React layer until the flip; it is a plain file, not React code.
import helpImage from '../../react-viewers/assets/quick-controls.svg'

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
