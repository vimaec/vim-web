/**
 * @module viw-webgl-react
 */

import React from 'react'

export type ProgressMode = '%' | 'bytes'

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
};

export type LoadingBoxPropsTyped = LoadingBoxProps & {
  type: 'loading'
};

/**
 * LoadingBox component that displays a loading message or other messages.
 * @param props - Component props containing optional content.
 * @returns The LoadingBox component or null if no content is provided.
 */
export function LoadingBox (props: { content: LoadingBoxProps }) {
  return (
    <div className="vim-loading-box vc-flex vc-box-content vc-gap-2 vc-flex-col vc-max-w-[320px] vc-max-h-[48px] vc-w-[72%] vc-h-[50%] vc-self-center vc-rounded vc-bg-white vc-px-5 vc-py-4 vc-shadow-lg">
      {content(props.content)}
      <div className="vim-loading-widget vc-mt-2"></div>
    </div>
  )
}

/**
 * Content component that displays the main content based on the provided info.
 * @param info - Message information.
 * @returns The content component with appropriate styling.
 */
function content (info: LoadingBoxProps) {
  return (
    <h1 className={'vim-loading-title vc-w-full vc-text-gray-medium'}>
      <div className="vc-flex vc-w-full vc-justify-between">
        <span> {info.message ?? 'Loading...'}</span>
        {info.progress ? <span>{formatProgress(info.progress, info.mode)} </span> : null}
      </div>
    </h1>
  )
}

/**
 * Formats bytes to megabytes with two decimal places.
 * @param bytes - The number of bytes to format.
 * @returns The formatted megabytes as a string.
 */
function formatProgress (progress: number, mode? : ProgressMode): string {
  if (progress <= 0) return ''
  mode = mode ?? '%'
  if (mode === '%') {
    return `${(progress * 100).toFixed(0)}%`
  } else {
    const BYTES_IN_MB = 1_000_000
    return `${(progress / BYTES_IN_MB).toFixed(2)} MB`
  }
}
