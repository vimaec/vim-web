/**
 * @module viw-webgl-component
 */

import React, { useEffect, useMemo, useState } from 'react'
import helpImage from '../assets/quick-controls.svg'
import * as Icons from './icons'
import { setComponentBehind } from '../helpers/html'
import { ComponentSettings } from '../settings/settings'
import { SideState } from '../sidePanel/sideState'

const urlSupport = 'https://support.vimaec.com'
const urlControls =
  'https://support.vimaec.com/en/articles/5872168-navigation-and-controls'

export type HelpState = {
  visible: boolean

  setVisible: (value: boolean) => void
}
/**
 * State closure for help page.
 */
export function useHelp (): HelpState {
  const [visible, setVisible] = useState(false)

  // Blur when help is visible
  useEffect(() => {
    setComponentBehind(visible)
  }, [visible])

  return useMemo(() => ({ visible, setVisible }), [visible, setVisible])
}

/**
 * JSX Memoized version of MenuHelp.
 */
export const MenuHelpMemo = React.memo(MenuHelp)

/**
 * JSX Component for help page.
 */
function MenuHelp (props: {
  help: HelpState
  settings: ComponentSettings
  side: SideState
}) {
  if (!props.help.visible) return null

  const onCloseBtn = () => {
    props.help.setVisible(false)
  }

  return (
    <>
      <div
        className="vim-help-overlay vc-absolute vc-inset-0 vc-z-40 vc-flex vc-h-full vc-w-full vc-items-center vc-justify-center vc-bg-black/90"
        onClick={onCloseBtn}
        onContextMenu={(event) => {
          event.preventDefault()
        }}
      > {closeButton(onCloseBtn)}
        <div
          className="vim-help-blocker vc-gap-4 vc-justify-center vc-max-w-[900px] vc-w-[90%] vc-h-[80%] vc-absolute vc-p-5 vc-flex vc-flex-col"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <div className="vim-help-top">
            <h2
              className="vim-help-title vc-title vc-text-center vc-font-bold vc-uppercase vc-text-white"
            >
              Key navigation controls
            </h2>
          </div>
            <img
              className="vim-help-img vc-min-h-0"
              src={helpImage}
            ></img>
          {props.settings.capacity.canFollowUrl ? linkButtons() : null}
        </div>
      </div>
    </>
  )
}

function closeButton(onButton: () => void) {
  return (
    <button
      className="vim-help-close vc-absolute vc-top-[20px] vc-right-[20px] vc-text-white"
      onClick={onButton}
    >
      {Icons.close({
        height: '20px',
        width: '20px',
        fill: 'currentColor'
      })}
    </button>
  );
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
