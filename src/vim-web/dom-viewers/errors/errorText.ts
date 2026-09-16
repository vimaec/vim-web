/**
 * Typography for error message bodies — the DOM twin of the React
 * errorStyle helpers. Plain semantic HTML styled by tokens in style.css;
 * no DS organism fits a multi-paragraph message.
 */
export type Inline = string | Node

function create<K extends keyof HTMLElementTagNameMap> (tag: K, className: string, content?: Inline): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  el.className = className
  if (typeof content === 'string') el.textContent = content
  else if (content) el.appendChild(content)
  return el
}

/** Joins strings and nodes into one fragment, for mixed-content lines. */
export function fragment (...parts: Inline[]): DocumentFragment {
  const frag = document.createDocumentFragment()
  frag.append(...parts)
  return frag
}

export function mainText (text: Inline): HTMLElement {
  return create('p', 'vim-ds-error__main', text)
}

export function detailText (text: string): HTMLElement {
  return create('span', 'vim-ds-error__detail', text)
}

export function bold (text: string): HTMLElement {
  return create('strong', 'vim-ds-error__bold', text)
}

export function subTitle (title: string): HTMLElement {
  return create('p', 'vim-ds-error__subtitle', title)
}

function list (tag: 'ul' | 'ol', variant: string, items: (Inline | null | undefined)[]): HTMLElement {
  const root = create(tag, `vim-ds-error__list vim-ds-error__list--${variant}`)
  for (const item of items) {
    if (!item) continue
    root.appendChild(create('li', '', item))
  }
  return root
}

export function dotList (items: (Inline | null | undefined)[]): HTMLElement {
  return list('ul', 'dot', items)
}

export function numList (items: (Inline | null | undefined)[]): HTMLElement {
  return list('ol', 'num', items)
}

/** "Label: value" pair. */
export function bullet (label: string, value: string): DocumentFragment {
  return fragment(create('span', 'vim-ds-error__bullet-label', label), ' ', create('span', 'vim-ds-error__bullet-value', value))
}

export function link (url: string, text: string): HTMLAnchorElement {
  const a = create('a', 'ds-link', text)
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  return a
}
