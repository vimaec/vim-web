import React, { useEffect, useMemo, useState } from 'react'
import helpImage from './assets/quick-controls.svg'
import * as Icons from './icons'
import { setComponentBehind } from './helpers/html'

const urlSupport = 'https://support.vimaec.com'
const urlControls =
  'https://support.vimaec.com/en/articles/5872168-navigation-and-controls'

export type HelpState = {
  visible: boolean
  setVisible: (value: boolean) => void
}

export function useHelp (): HelpState {
  const [visible, setVisible] = useState(false)

  // Blur when help is visible
  useEffect(() => {
    setComponentBehind(visible)
  }, [visible])

  return useMemo(() => ({ visible, setVisible }), [visible, setVisible])
}

export const MenuHelp = React.memo(_MenuHelp)
function _MenuHelp (props: { help: HelpState }) {
  if (!props.help.visible) return null

  const onCloseBtn = () => {
    props.help.setVisible(false)
  }
  const onControlsBtn = () => {
    window.open(urlControls)
  }
  const onHelpBtn = () => {
    window.open(urlSupport)
  }

  return (
    <>
      <div
        className="menu-help-overlay z-10 absolute inset-0 bg-black/80 w-full h-full flex items-center justify-center"
        onClick={onCloseBtn}
      >
        <div
          className="flex flex-col py-5"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <div className="flex justify-between mb-8">
            <h2 className="text-white font-bold text-sm uppercase">
              Key navigation controls
            </h2>
            <button className="text-white" onClick={onCloseBtn}>
              {Icons.close({
                height: '20px',
                width: '20px',
                fill: 'currentColor'
              })}
            </button>
          </div>
          <div className="">
            <img
              className="menu-help-controls mb-8 mx-auto 2xl:w-[50vw]"
              src={helpImage}
            ></img>
          </div>
          <div className="flex justify-end">
            <button
              className="text-white text-xs font-bold uppercase border border-white hover:border-primary-royal hover:bg-primary-royal rounded-full py-2 px-8 mr-4"
              onClick={onControlsBtn}
            >
              Full Control List
            </button>
            <button
              className="text-primary text-xs font-bold border border-white uppercase bg-white hover:border-primary-royal hover:text-white hover:bg-primary-royal rounded-full py-2 px-8"
              onClick={onHelpBtn}
            >
              Help Center
            </button>
          </div>
        </div>
      </div>
    </>
  )
}