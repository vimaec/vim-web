import React, { useEffect, useRef, useState, useMemo } from 'react'
import { settings } from './icons'
import { Settings } from './settings/settings'

/**
 * Panel to output logs
 */
export function Logs (props: {
  visible: boolean
  text: string
  settings: Settings
}) {
  const textbox = useRef<HTMLTextAreaElement>()
  const anchor = useRef<HTMLAnchorElement>(null)
  const prev = useRef<string>()
  const url = props.settings.capacity.canDownload
    ? useMemo(() => {
      return (prev.current = updateDownloadLink(prev.current, props.text))
    }, [props.text])
    : null

  const onCopyBtn = (textbox: HTMLTextAreaElement) => {
    textbox.select()
    navigator.clipboard.writeText(props.text)
  }

  return props.visible
    ? (
    <div className="vim-logs vc-h-full vc-w-full">
      <h2 className="vim-bim-upper-title vc-mb-6 vc-text-xs vc-font-bold vc-uppercase">
        Logs
      </h2>
      <button
        className="vim-logs-copy bg-transparent vc-absolute vc-top-4 vc-ml-12 vc-rounded vc-border vc-border-light-blue vc-py-1 vc-px-2 vc-font-semibold vc-text-light-blue hover:vc-border-transparent hover:vc-bg-light-blue hover:vc-text-white"
        onClick={() => onCopyBtn(textbox.current)}
      >
        Copy
      </button>
      {props.settings.capacity.canDownload
        ? (
        <button className="vim-logs-copy bg-transparent vc-absolute vc-top-4 vc-ml-28 vc-rounded vc-border vc-border-light-blue vc-py-1 vc-px-2 vc-font-semibold vc-text-light-blue hover:vc-border-transparent hover:vc-bg-light-blue hover:vc-text-white">
          <a ref={anchor} href={url} download="cells">
            Save
          </a>
        </button>
          )
        : null}
      <textarea
        ref={textbox}
        readOnly={true}
        className="vim-logs-box vc-h-full vc-w-full"
        value={props.text}
      ></textarea>
    </div>
      )
    : null
}

function updateDownloadLink (previous: string, text: string) {
  if (previous) {
    URL.revokeObjectURL(previous)
    console.log('revoked: ' + previous)
  }

  const blob = new Blob([text], { type: 'csv' })
  const r = URL.createObjectURL(blob)
  console.log('created: ' + r)
  return r
}

/**
 * Returns a state object to interact with the log panel.
 */
export function useLogState () {
  const logRef = useRef<string>()
  const [log, setLog] = useState<string>()
  return useMemo(() => {
    return {
      log: (value: string) => {
        logRef.current = [logRef.current, value].join('\n').trim()
        setLog(logRef.current)
      },
      clear: () => setLog(''),
      getLog: () => log
    } as LogsRef
  }, [log])
}

export type LogsRef = {
  log: (value: string) => void
  clear: () => void
  getLog: () => string
}
