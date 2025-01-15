import { UltraReact } from '../../vim-web'
import { AccessToken } from '../utils/accesToken'

export function UltraAccessToken () {
  return AccessToken(createComponent)
}
  
async function createComponent (div: HTMLDivElement, url: string, token: string) {
  const ultra = await UltraReact.createUltraComponent(div)
  await ultra.viewer.connect()
  const request = ultra.load({url: url, authToken: token})
  await request.getResult()
  await ultra.viewer.camera.frameAll(0)
  return ultra
}
