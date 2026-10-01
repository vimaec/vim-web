import { createBar } from '../ds'
import type { LoadingBoxProps, ProgressMode } from './types'

export function formatProgress (progress: number, mode: ProgressMode = 'percent'): string {
  if (progress <= 0) return ''
  if (mode === 'percent') return `${progress.toFixed(0)}%`
  const BYTES_IN_MB = 1_000_000
  return `${(progress / BYTES_IN_MB).toFixed(2)} MB`
}

/**
 * Loading content for the modal body: what is being loaded, and how far along. A bar is drawn only
 * when there is a proportion to draw — a download of unknown length counts bytes instead, and an
 * empty track that never fills says less than the number beside it.
 */
export function renderLoadingBox (body: HTMLElement, props: LoadingBoxProps): { destroy (): void } {
  const root = document.createElement('div')
  root.className = 'vim-ds-loading'

  if (props.source) {
    const source = document.createElement('div')
    source.className = 'vim-ds-loading__source'
    source.textContent = props.source
    source.title = props.source
    root.appendChild(source)
  }

  const text = formatProgress(props.progress ?? 0, props.mode)
  if (text) {
    const progress = document.createElement('div')
    progress.className = 'vim-ds-loading__progress'
    progress.textContent = text
    root.appendChild(progress)
  }

  const determinate = (props.mode ?? 'percent') === 'percent' && (props.progress ?? 0) > 0
  const indicator = determinate ? createBar(root, { value: props.progress, max: 100 }) : undefined

  if (props.more !== undefined) {
    root.appendChild(typeof props.more === 'string' ? document.createTextNode(props.more) : props.more)
  }
  body.appendChild(root)

  return {
    destroy: () => {
      indicator?.destroy()
      root.remove()
    }
  }
}

/** The "try VIM Ultra" hint shown under long WebGL loads. */
export function ultraSuggestion (): HTMLElement {
  const root = document.createElement('div')
  root.className = 'vim-ds-ultra-suggestion'
  const lead = document.createElement('span')
  lead.textContent = 'Large model? Long wait time?'
  const line = document.createElement('div')
  const link = document.createElement('a')
  link.className = 'ds-link'
  link.href = 'https://docs.vimaec.com/docs/vim-flex/vim-ultra'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = 'VIM Ultra'
  line.append('Check out ', link, ' for free.')
  root.append(lead, line)
  return root
}
