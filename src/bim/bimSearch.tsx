import React, { useEffect, useRef, useState } from 'react'
import { ViewerWrapper } from '../helpers/viewer'
import * as Icons from '../icons'

const SEARCH_DELAY_MS = 200
export function BimSearch (props: {
  viewer: ViewerWrapper
  filter: string
  setFilter: (s: string) => void
  count: number
}) {
  const [text, setText] = useState('')
  const changeTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    setText(props.filter)
  }, [props.filter])

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    setText(value)
    clearTimeout(changeTimeout.current)
    changeTimeout.current = setTimeout(
      () => {
        props.setFilter(value)
        console.log('set filter ' + value)
      },

      SEARCH_DELAY_MS
    )
  }

  const onClear = () => {
    console.log('clear filter')
    setText('')
    clearTimeout(changeTimeout.current)
    props.setFilter('')
  }

  const onFocus = () => {
    props.viewer.base.inputs.keyboard.unregister()
  }

  const onBlur = () => {
    props.viewer.base.inputs.keyboard.register()
  }

  return (
    <div className="vim-bim-search vc-mb-4 vc-flex vc-items-center">
      <svg
        className="search-icon -vc-mr-4 vc-text-gray-light"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        viewBox="0 0 256 256"
      >
        <path
          fill="currentColor"
          id="ICONS"
          d="m244.485 216.201-39.552-39.552a11.956 11.956 0 0 0-8.81-3.5C208.621 155.986 216 134.856 216 112 216 54.562 169.438 8 112 8S8 54.562 8 112s46.562 104 104 104c22.856 0 43.986-7.379 61.149-19.877a11.956 11.956 0 0 0 3.5 8.81l39.552 39.552c4.686 4.686 12.284 4.686 16.971 0l11.313-11.313c4.686-4.687 4.686-12.285 0-16.971ZM112 184c-39.701 0-72-32.299-72-72s32.299-72 72-72 72 32.299 72 72-32.299 72-72 72Z"
        />
      </svg>
      <input
        className="search-input vc-placeholder-text-gray-medium vc-w-full vc-border-b vc-border-t-0 vc-border-l-0 vc-border-r-0 vc-border-gray-light vc-bg-transparent vc-py-1 vc-pl-6 vc-outline-none focus-within:vc-border-b-primary-royal focus-within:vc-text-primary-royal focus-within:vc-outline-none focus:vc-outline-none active:vc-text-primary-royal"
        type="input"
        name="name"
        placeholder="Type here to search"
        value={text}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={onChange}
      />
      <button className="search-clear" onClick={onClear}>
        {text.length > 0
          ? Icons.close({ width: 16, height: 16, fill: 'currentColor' })
          : null}
      </button>

      {props.count !== undefined && text
        ? (
        <div className="search-count vc-absolute vc-right-16 vc-rounded-full vc-bg-primary-royal vc-py-1 vc-px-2 vc-text-xs vc-font-bold vc-text-white">
          {props.count}
        </div>
          )
        : null}
    </div>
  )
}
