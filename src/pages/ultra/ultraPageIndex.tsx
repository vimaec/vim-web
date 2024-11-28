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

export const ultraPages = [
  { path: '/ultra', component: <UltraHome /> },
  { path: '/ultra/connection_error', component: <UltraConnectionError /> },
  { path: '/ultra/download_error', component: <UltraDownloadError /> },
  { path: '/ultra/open_error', component: <UltraOpenError /> },
  { path: '/ultra/load_error', component: <UltraLoadError /> },
  { path: '/ultra/abort_error', component: <UltraAbortError /> },
  { path: '/ultra/colors', component: <UltraColors /> },
  { path: '/ultra/node_effects', component: <UltraNodeEffects /> },
  { path: '/ultra/camera', component: <UltraCamera /> },
  { path: '/ultra/background', component: <UltraBackground /> },
  { path: '/ultra/ibl_lock', component: <UltraIblLock /> },
  { path: '/ultra/ghost_color', component: <UltraGhostColor /> },
  { path: '/ultra/resize', component: <UltraResize /> }
]
