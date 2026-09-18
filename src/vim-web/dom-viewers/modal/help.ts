export const HELP_TITLE = 'Key navigation controls'

/**
 * The navigation poster, drawn rather than shipped as an image: a card grid of
 * mouse diagrams, keycap clusters and a shortcut list, all on DS tokens so it
 * follows the theme. Ported from VIM Flex's `vf-key-help`, with vim-web's own
 * bindings (the core's input handler plus the WebGL viewer's overrides).
 */

/** Mouse diagram with one part highlighted; the clip id is unique per instance. */
let mouseSeq = 0
function mouse (part: 'left' | 'right' | 'wheel'): string {
  const id = `vim-ds-help-mouse-${mouseSeq++}`
  const hi = 'var(--vim-cyan)'
  const idle = 'var(--stage-600)'
  const left = part === 'left' ? hi : idle
  const right = part === 'right' ? hi : idle
  const wheel = part === 'wheel' ? hi : idle
  return '<svg class="vim-ds-help__mouse" width="44" height="62" viewBox="0 0 48 68" aria-hidden="true">' +
    `<defs><clipPath id="${id}"><rect x="2" y="2" width="44" height="64" rx="21"/></clipPath></defs>` +
    '<rect x="2" y="2" width="44" height="64" rx="21" fill="var(--stage-700)" stroke="var(--hairline)"/>' +
    `<g clip-path="url(#${id})">` +
    `<rect x="2" y="2" width="21" height="29" fill="${left}"/>` +
    `<rect x="25" y="2" width="21" height="29" fill="${right}"/>` +
    '</g>' +
    '<line x1="2" y1="31" x2="46" y2="31" stroke="var(--hairline)"/>' +
    `<rect x="20.5" y="9" width="7" height="17" rx="3.5" fill="${wheel}" stroke="var(--hairline)"/>` +
    '</svg>'
}

const kbd = (key: string) => `<span class="vim-ds-help__kbd">${key}</span>`

const keycap = (key: string, label: string) =>
  `<div class="vim-ds-help__key"><span class="vim-ds-help__kbd vim-ds-help__kbd--big">${key}</span>` +
  `<span class="vim-ds-help__caption">${label}</span></div>`

const row = (key: string, what: string) =>
  `<div class="vim-ds-help__row">${kbd(key)}<span>${what}</span></div>`

const card = (diagram: string, title: string, how: string) =>
  `<div class="vim-ds-help__card">${diagram}<h4>${title}</h4><div class="vim-ds-help__how">${how}</div></div>`

/** Static markup — no interpolated input, so it is built in one pass. */
function content (): string {
  return '<div class="vim-ds-help">' +
    card(mouse('left'), 'Orbit', 'Left-click and drag') +
    card(mouse('right'), 'Look Around', 'Right-click and drag') +
    card(mouse('wheel'), 'Zoom', 'Scroll — zooms toward the cursor') +
    card(mouse('wheel'), 'Pan', 'Middle-click and drag') +

    '<div class="vim-ds-help__card vim-ds-help__card--wide"><h4>Move the Camera</h4>' +
      '<div class="vim-ds-help__clusters">' +
        '<div class="vim-ds-help__wasd"><div></div>' + keycap('W', 'Forward') + '<div></div>' +
          keycap('A', 'Left') + keycap('S', 'Back') + keycap('D', 'Right') + '</div>' +
        '<div class="vim-ds-help__updown">' + keycap('E', 'Up') + keycap('Q', 'Down') + '</div>' +
      '</div>' +
      '<div class="vim-ds-help__keys">' + kbd('+') + kbd('−') + '<span class="vim-ds-help__how">speed</span>' +
        '<span class="vim-ds-help__how">· hold</span>' + kbd('Shift') + '<span class="vim-ds-help__how">×3</span>' +
      '</div>' +
      '<div class="vim-ds-help__how">Arrow keys work too — click the 3D view first so it has keyboard focus.</div>' +
    '</div>' +

    '<div class="vim-ds-help__card vim-ds-help__card--wide"><h4>Selection</h4><div class="vim-ds-help__rows">' +
      row('Click', 'Select an element') +
      row('Shift + Click', 'Add to the selection') +
      row('Double-click', 'Frame what you clicked') +
      row('Esc', 'Clear the selection') +
    '</div></div>' +

    '<div class="vim-ds-help__card vim-ds-help__card--wide"><h4>Camera</h4><div class="vim-ds-help__rows">' +
      row('F', 'Frame the selection') +
      row('Home', 'Reset the camera') +
      row('P', 'Toggle orthographic') +
    '</div></div>' +

    '<div class="vim-ds-help__card vim-ds-help__card--wide"><h4>Visibility &amp; Panels</h4><div class="vim-ds-help__rows">' +
      row('I', 'Isolate the selection, or show all') +
      row('V', 'Hide or show the selection') +
      row('F4', 'Toggle the settings panel') +
    '</div></div>' +
    '</div>'
}

/** Renders the help poster into the modal body. */
export function renderHelp (body: HTMLElement): { destroy (): void } {
  const root = document.createElement('div')
  root.className = 'vim-ds-help-body'
  root.innerHTML = content()
  body.appendChild(root)
  return { destroy: () => root.remove() }
}
