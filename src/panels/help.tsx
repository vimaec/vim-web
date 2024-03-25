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
        className="vim-help-overlay vc-absolute vc-inset-0 vc-z-40 vc-flex vc-h-full vc-w-full vc-items-center vc-justify-center vc-bg-black/80"
        onClick={onCloseBtn}
        onContextMenu={(event) => {
          event.preventDefault()
        }}
      >
        <div
          className="vim-help-blocker vc-flex vc-flex-col vc-py-5"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <div className="vim-help vc-mb-8 vc-flex vc-justify-between">
            <h2
              className="vim-help-title vc-text-sm vc-font-bold vc-uppercase vc-text-white"
              style={{
                marginLeft: props.side.getWidth(),
                maxWidth: `calc(100% - ${props.side.getWidth()}px)`
              }}
            >
              Key navigation controls
            </h2>
            <button
              className="vim-help-close vc-text-white"
              onClick={onCloseBtn}
            >
              {Icons.close({
                height: '20px',
                width: '20px',
                fill: 'currentColor'
              })}
            </button>
          </div>
          <div className="">
            <img
              className="vim-help-img vc-2xl:w-[50vw] vc-mx-auto vc-mb-8"
              src={helpImage}
              style={{
                marginLeft: props.side.getWidth(),
                maxWidth: `calc(100% - ${props.side.getWidth()}px)`
              }}
            ></img>
          </div>
          {props.settings.capacity.canFollowUrl ? linkButtons() : null}
        </div>
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

  return (
    <div className="vc-flex vc-justify-end">
      <button
        className="vc-hover:border-primary-royal vc-hover:bg-primary-royal vc-mr-4 vc-rounded-full vc-border vc-border-white vc-py-2 vc-px-8 vc-text-xs vc-font-bold vc-uppercase vc-text-white"
        onClick={onControlsBtn}
      >
        Full Control List
      </button>
      <button
        className="vc-rounded-full vc-border vc-border-white vc-bg-white vc-py-2 vc-px-8 vc-text-xs vc-font-bold vc-uppercase vc-text-primary hover:vc-border-primary-royal hover:vc-bg-primary-royal hover:vc-text-white"
        onClick={onHelpBtn}
      >
        Help Center
      </button>
    </div>
  )
}
