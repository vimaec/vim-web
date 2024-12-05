import React from 'react'
import { WebglHome } from './00_home'
import { WebglAccessToken } from './01_accessToken'


export const gitRoot = 'https://github.com/vimaec/vim-web/tree/main/src/pages/webgl'
export const webglPages = [
  { path: '/webgl', page: gitRoot+'/00_home.tsx', component: <WebglHome /> },
  { path: '/webgl/accessToken', page: gitRoot+'/01_accessToken.tsx', component: <WebglAccessToken /> }
]