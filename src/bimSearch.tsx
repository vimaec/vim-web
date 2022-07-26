import React from 'react'
import * as VIM from 'vim-webgl-viewer'


export function BimSearch(props: { viewer: VIM.Viewer, filter: string, setFilter :(s:string) => void }){
  //console.log('Render BimSearch Init')

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    props.setFilter(e.currentTarget.value)
  }

  const onFocus = () => {
    props.viewer.inputs.unregisterKeyboard()
  }

  const onBlur = () => {
    props.viewer.inputs.registerKeyboard()
  }

  //console.log('Render BimSearch Done')
  return <div className="vim-bim-search mb-4">
    <input className="w-full bg-transparent border-b border-gray-light placeholder-text-gray-medium py-1 px-4"
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