/**
 * @module viw-webgl-react
 */

import React, { ReactNode } from 'react'


export type ProgressMode = 'percent' | 'bytes'

/**
 * Interface for message information displayed in the LoadingBox.
 * @property message - Optional main message text.
 * @property info - Optional additional information or tooltip text.
 * @property progress - The progress of an operation.
 */
export type LoadingBoxProps = {
  message?: string;
  progress?: number;
  mode? : ProgressMode;
  more?: ReactNode;
};

export type LoadingBoxPropsTyped = LoadingBoxProps & {
  type: 'loading'
};

/**
 * LoadingBox viewer that displays a loading message or other messages.
 * @param props - Component props containing optional content.
 * @returns The LoadingBox viewer or null if no content is provided.
 */
export function LoadingBox (props: { content: LoadingBoxProps }) {
  return (
    <div className="vim-loading-box">
      {content(props.content)}
      <div className="vim-loading-widget"></div>
      {props.content.more ?? null}
    </div>
  )
}

/**
 * Content viewer that displays the main content based on the provided info.
 * @param info - Message information.
 * @returns The content viewer with appropriate styling.
 */
function content (info: LoadingBoxProps) {
  return (
    <h1 className='vim-loading-title'>
      <div className="vim-loading-header-row">
        <span> {info.message ?? 'Loading...'}</span>
        {info.progress ? <span>{formatProgress(info.progress, info.mode)} </span> : null}
      </div>
    </h1>
  )
}

/**
 * Formats progress for display.
 * @param progress - The progress value (bytes for 'bytes' mode, 0-100 for 'percent' mode).
 * @param mode - The display mode.
 * @returns The formatted progress as a string.
 */
function formatProgress (progress: number, mode? : ProgressMode): string {
  if (progress <= 0) return ''
  mode = mode ?? 'percent'
  if (mode === 'percent') {
    return `${progress.toFixed(0)}%`
  } else {
    const BYTES_IN_MB = 1_000_000
    return `${(progress / BYTES_IN_MB).toFixed(2)} MB`
  }
}

export function UltraSuggestion() {
  return (
    <div className="vim-ultra-suggestion">
      <span>Large model? Long wait time?</span>
      <div>
        Check out {' '}
        <a
          href='https://docs.vimaec.com/docs/vim-flex/vim-ultra'
          target="_blank"
          rel="noopener noreferrer"
        >
          VIM Ultra
        </a>
        {' '} for free.
      </div>
    </div>
  );
}
