/**
 * @module viw-webgl-react
 */

import helpImage from '../assets/quick-controls.svg'

export type HelpPropsTyped = {
  type: 'help'
}

/**
 * JSX Component for help page.
 */
export function MenuHelp () {
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
      </div>
    </>
  )
}