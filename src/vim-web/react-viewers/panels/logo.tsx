/**
 * @module viw-webgl-react
 */

import React from 'react'
import logo from '../assets/logo.png'

export const LogoMemo = React.memo(() => (
  <div style={{ width: 'min(128px, 20%' }} className='vim-logo'>
    <a href="https://vimaec.com">
      <img className="vim-logo-img" src={logo}></img>
    </a>
  </div>
))
