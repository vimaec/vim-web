import React from 'react'
import * as VIM from 'vim-webgl-viewer'


export function BimSearch(props: { viewer: VIM.Viewer, filter: string, setFilter :(s:string) => void }){
  //console.log('Render BimSearch Init')

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    props.setFilter(e.currentTarget.value)
  }

  const onFocus = () => {
    props.viewer.inputs.keyboard.unregister()
  }

  const onBlur = () => {
    props.viewer.inputs.keyboard.register()
  }


  console.log('Render BimSearch Done')
  return <div className="vim-bim-search mb-4 flex">
    <svg className='text-gray-light -mr-4' xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 256 256">
      <path fill="currentColor" id="ICONS" d="m244.485 216.201-39.552-39.552a11.956 11.956 0 0 0-8.81-3.5C208.621 155.986 216 134.856 216 112 216 54.562 169.438 8 112 8S8 54.562 8 112s46.562 104 104 104c22.856 0 43.986-7.379 61.149-19.877a11.956 11.956 0 0 0 3.5 8.81l39.552 39.552c4.686 4.686 12.284 4.686 16.971 0l11.313-11.313c4.686-4.687 4.686-12.285 0-16.971ZM112 184c-39.701 0-72-32.299-72-72s32.299-72 72-72 72 32.299 72 72-32.299 72-72 72Z"/>
    </svg>
    <input className="w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 border-gray-light outline-none focus:outline-none focus-within:outline-none focus-within:border-b-primary-royal placeholder-text-gray-medium py-1 px-6"
      type="search"
      name="name" 
      placeholder="Type here to search"
      value = {props.filter}
      onFocus = {onFocus}
      onBlur = {onBlur}
      onChange = {onChange}
    />
  </div>
}