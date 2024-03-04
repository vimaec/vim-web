import React from 'react'
import logo from '../assets/logo.png'

export const LogoMemo = React.memo(() => (
  <div className={'vim-logo vc-fixed vc-top-4 vc-left-4'}>
    <a href="https://vimaec.com">
      <img className="vim-logo-img vc-h-12 vc-w-32" src={logo}></img>
    </a>
  </div>
))