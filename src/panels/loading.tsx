/**
 * @module viw-webgl-component
 */

import React, { useEffect } from 'react'
import { setComponentBehind } from '../helpers/html'
import * as Icons from './icons'

/**
 * Type representing the progress of an operation.
 * - `'processing'`: Indicates that processing is ongoing.
 * - `number`: Represents the progress in bytes.
 * - `string`: Represents an error message.
 */
type Progress = 'processing' | number | string;

/**
 * Interface for message information displayed in the LoadingBox.
 * @property message - Optional main message text.
 * @property info - Optional additional information or tooltip text.
 * @property progress - The progress of an operation.
 */
export type MsgInfo = {
  message?: string;
  info?: string;
  progress?: Progress;
};

/**
 * Compares two MsgInfo objects for equality.
 * @param msg1 - The first message to compare.
 * @param msg2 - The second message to compare.
 * @returns True if all properties are equal, false otherwise.
 */
function MsgEquals (msg1: MsgInfo, msg2: MsgInfo): boolean {
  if (!msg1 && !msg2) return true
  if (!msg1 || !msg2) return false
  return (
    msg1.message === msg2.message &&
    msg1.info === msg2.info &&
    msg1.progress === msg2.progress
  )
}

/**
 * Memoized version of the LoadingBox component.
 * Prevents unnecessary re-renders by comparing previous and next props using MsgEquals.
 */
export const LoadingBoxMemo = React.memo(
  LoadingBox,
  (prev, next) => MsgEquals(prev.content, next.content)
)

/**
 * LoadingBox component that displays a loading message or other messages.
 * @param props - Component props containing optional content.
 * @returns The LoadingBox component or null if no content is provided.
 */
function LoadingBox (props: { content?: MsgInfo }) {
  // Side effect to set the component behind state based on content presence.
  useEffect(() => {
    setComponentBehind(props.content !== undefined)
  }, [props.content])

  // If no content is provided, render nothing.
  if (!props.content) return null

  return (
    <div
      className="vim-loading-container vc-absolute vc-inset-0 vc-z-40 vc-flex vc-items-center vc-justify-center vc-bg-overflow vc-backdrop-blur"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="vim-loading-box vc-flex vc-box-content vc-gap-2 vc-flex-col vc-max-w-[320px] vc-max-h-[60px] vc-w-[72%] vc-h-[50%] vc-self-center vc-rounded vc-bg-white vc-px-5 vc-py-4 vc-shadow-lg">
        {Content(props.content)}
        {Gizmo(props.content)}
      </div>
    </div>
  )
}

/**
 * Gizmo component that displays a loading widget if progress is a number.
 * @param info - Message information containing progress.
 * @returns A loading widget or null if progress is not a number.
 */
function Gizmo (info: MsgInfo) {
  // Only render the gizmo if progress is a number (indicating loading progress).
  if (typeof info.progress !== 'number') return null
  return <div className="vim-loading-widget"></div>
}

/**
 * Content component that displays the main content based on the provided info.
 * @param info - Message information.
 * @returns The content component with appropriate styling.
 */
function Content (info: MsgInfo) {
  // Determine the class for centering text based on the progress type.
  const center =
    typeof info.progress === 'number' ? '' : 'vc-text-center vc-my-auto'

  return (
    <h1
      className={`vim-loading-title vc-w-full vc-text-gray-medium ${center}`}
    >
      {Text(info)}
    </h1>
  )
}

/**
 * Text component that renders the appropriate text based on the provided info.
 * @param info - Message information.
 * @returns The text component displaying status messages or errors.
 */
function Text (info: MsgInfo) {
  // Handle the 'processing' state.
  if (info.progress === 'processing') {
    return 'Processing'
  }

  // Handle numeric progress (loading with progress indicator).
  if (typeof info.progress === 'number') {
    return (
      <div className="vc-flex vc-w-full vc-justify-between">
        <span>Loading...</span>
        <span>{formatMBs(info.progress)} MB</span>
      </div>
    )
  }

  // Handle error state when progress is a string (other than 'processing').
  if (typeof info.progress === 'string') {
    return (
      <>
        {'Error Loading Vim File'}
        {InfoBtn(info.progress)}
      </>
    )
  }

  // Default case: display the message and optional info button.
  return (
    <>
      {info.message}
      {InfoBtn(info.info)}
    </>
  )
}

/**
 * InfoBtn component that displays an information button with a tooltip.
 * @param message - The tooltip message to display.
 * @returns An info button or null if no message is provided.
 */
function InfoBtn (message: string | undefined) {
  if (!message) return null
  return (
    <span className="vc-ml-1" data-tip={message}>
      {Icons.help({
        height: '16',
        width: '16',
        fill: 'currentColor',
        className: 'vc-inline'
      })}
    </span>
  )
}

/**
 * Formats bytes to megabytes with two decimal places.
 * @param bytes - The number of bytes to format.
 * @returns The formatted megabytes as a string.
 */
function formatMBs (bytes: number): string {
  const BYTES_IN_MB = 1_000_000
  return (bytes / BYTES_IN_MB).toFixed(2)
}
