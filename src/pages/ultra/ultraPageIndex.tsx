import React from 'react'
import { UltraHome } from './00_home'
import { UltraAbortError } from './05_abortError'
import { UltraConnectionError } from './01_connectionError'
import { UltraOpenError } from './03_openError'
import { UltraDownloadError } from './02_downloadError'
import { UltraLoadError } from './04_loadError'
import { UltraColors } from './06_colors'
import { UltraNodeEffects } from './07_nodeEffects'
import { UltraCamera } from './08_camera'
import { UltraBackground } from './09_background'
import { UltraIblLock } from './10_iblLock'
import { UltraGhostColor } from './11_ghostColor'
import { UltraResize } from './12_resize'
import { UltraAccessToken } from './00a_accessToken'

export const gitRoot = 'https://github.com/vimaec/vim-web/tree/main/src/pages/ultra'

export const ultraPages = [
  { path: '/ultra', page: gitRoot+'/00_home.tsx', component: <UltraHome /> },
  { path: '/ultra/access_token', page: gitRoot+'/00a_accessToken.tsx', component: <UltraAccessToken /> },
  { path: '/ultra/connection_error', page: gitRoot+'/01_connectionError.tsx', component: <UltraConnectionError /> },
  { path: '/ultra/download_error', page: gitRoot+'/02_downloadError.tsx', component: <UltraDownloadError /> },
  { path: '/ultra/open_error', page: gitRoot+'/03_openError.tsx', component: <UltraOpenError /> },
  { path: '/ultra/load_error', page: gitRoot+'/04_loadError.tsx', component: <UltraLoadError /> },
  { path: '/ultra/abort_error', page: gitRoot+'/05_abortError.tsx', component: <UltraAbortError /> },
  { path: '/ultra/colors', page: gitRoot+'/06_colors.tsx', component: <UltraColors /> },
  { path: '/ultra/node_effects', page: gitRoot+'/07_nodeEffects.tsx', component: <UltraNodeEffects /> },
  { path: '/ultra/camera', page: gitRoot+'/08_camera.tsx', component: <UltraCamera /> },
  { path: '/ultra/background', page: gitRoot+'/09_background.tsx', component: <UltraBackground /> },
  { path: '/ultra/ibl_lock', page: gitRoot+'/10_iblLock.tsx', component: <UltraIblLock /> },
  { path: '/ultra/ghost_color', page: gitRoot+'/11_ghostColor.tsx', component: <UltraGhostColor /> },
  { path: '/ultra/resize', file: gitRoot+'/12_resize.tsx', component: <UltraResize /> }
]
