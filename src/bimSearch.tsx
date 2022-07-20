import React from 'react'
import * as VIM from 'vim-webgl-viewer'


export function BimSearch(props: { viewer: VIM.Viewer, filter: string, setFilter :(s:string) => void }){

  const onSubmit = (e: React.FormEvent<HTMLInputElement>) => {
    console.log('Done')
    console.log(e.currentTarget.value)
  }

  const onChange = (e: React.FormEvent<HTMLInputElement>) => {
    console.log(e.currentTarget.value)
    props.setFilter(e.currentTarget.value)
  }

  const onFocus = () => {
    props.viewer.inputs.unregisterKeyboard()
  }

  const onBlur = () => {
    props.viewer.inputs.registerKeyboard()
  }

  return <div className="vim-bim-search">
    <input
      value = {props.filter}
      onFocus = {onFocus}
      onBlur = {onBlur}
      onChange = {onChange}
      onSubmit = {onSubmit}
      type = "text"
      name = "name"/>
  </div>
}