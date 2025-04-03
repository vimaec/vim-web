import { WebglHome } from './00_home'
import { WebglLocalFile } from './00a_localFile'
import { WebglAccessToken } from './01_accessToken'
import { WebglInvalidFile } from './02_invalidFile'
import { WebglZippedFile } from './03_zippedFile'
import { WebglIframe } from './04_iframe'
import { WebglMarkers } from './05_markers'


export const gitRoot = 'https://github.com/vimaec/vim-web/tree/main/src/pages/webgl'
export const webglPages = [
  { path: '/webgl', page: gitRoot+'/00_home.tsx', component: <WebglHome /> },
  { path: '/webgl/local_file', page: gitRoot+'/00_localFile.tsx', component: <WebglLocalFile /> },
  { path: '/webgl/accessToken', page: gitRoot+'/01_accessToken.tsx', component: <WebglAccessToken /> },
  { path: '/webgl/invalid_file', page: gitRoot+'/02_invalidFile.tsx', component: <WebglInvalidFile /> },
  { path: '/webgl/zippedFile', page: gitRoot+'/03_zippedFile', component: <WebglZippedFile /> },
  { path: '/webgl/iframe', page: gitRoot+'/04_iframe', component: <WebglIframe /> },
  { path: '/webgl/markers', page: gitRoot+'/05_markers', component: <WebglMarkers /> },
]