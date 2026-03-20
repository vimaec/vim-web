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
        className="vim-help-blocker"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className="vim-help-top">
          <h2 className="vim-help-title">
            Key navigation controls
          </h2>
        </div>
        <img className="vim-help-img" src={helpImage}></img>
      </div>
    </>
  )
}