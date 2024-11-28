/**
 * @module viw-webgl-component
 */

import React from 'react'
import logo from '../assets/logo.png'

export const LogoMemo = React.memo(() => (
  <div style={{ width: 'min(128px, 20%' }} className={'vim-logo vc-absolute vc-top-4 vc-left-4 vc-flex'}>
    <a href="https://vimaec.com">
      <img className="vc-absolute vim-logo-img" src={logo}></img>
    </a>
  </div>
))
