/**
 * @module viw-webgl-component
 */

import React from 'react'
import logo from '../assets/logo.png'

export const LogoMemo = React.memo(() => (
  <div className={'vim-logo vc-absolute vc-top-4 vc-left-4'}>
    <a href="https://vimaec.com">
      <img style={{ width: 'min(128px, 20%' }} className="vim-logo-img" src={logo}></img>
    </a>
  </div>
))
