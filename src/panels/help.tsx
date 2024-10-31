/**
 * @module viw-webgl-component
 */

import React from 'react'
import helpImage from '../assets/quick-controls.svg'

const urlSupport = 'https://support.vimaec.com'
const urlControls =
  'https://support.vimaec.com/en/articles/5872168-navigation-and-controls'

export type HelpProps = {
  type: 'help'
  onClose: () => void
  link: boolean
}

/**
 * JSX Component for help page.
 */
export function MenuHelp (props: {
  value: HelpProps
}) {
  const prop = props.value
  return (
    <>
      <div
        className="vim-help-blocker vc-gap-4 vc-justify-center vc-max-w-[900px] vc-w-[90%] vc-h-[80%] vc-absolute vc-p-5 vc-flex vc-flex-col"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className="vim-help-top">
          <h2
            className="vim-help-title vc-text-center vc-font-bold vc-uppercase vc-text-white"
          >
            Key navigation controls
          </h2>
        </div>
          <img
            className="vim-help-img vc-min-h-0"
            src={helpImage}
          ></img>
        {prop.link ? linkButtons() : null}
      </div>
    </>
  )
}

function linkButtons () {
  const onControlsBtn = () => {
    window.open(urlControls)
  }
  const onHelpBtn = () => {
    window.open(urlSupport)
  }

  const text = (text: string) => {
    return <div className="vc-overflow-hidden vc-whitespace-nowrap vc-text-clip vc-uppercase vc-font-bold">{text}</div>
  }

  const hover = 'hover:vc-border-primary-royal hover:vc-bg-primary-royal hover:vc-text-white'
  const shape = 'vc-rounded-full vc-border vc-border-white'
  return (
    <div
    className="vim-help-bottom vc-flex vc-gap-4 vc-justify-center vc-min-w-0 vc-min-h-0">
      <button
        className={`vim-help-button ${hover} ${shape} vc-text-white`}
        onClick={onControlsBtn}
      >
        {text('Full Control List')}
      </button>
      <button
        className= {`vim-help-button ${hover} ${shape} vc-bg-white vc-text-primary`}
        onClick={onHelpBtn}
      >{text('Help Center')}
      </button>
    </div>
  )
}
