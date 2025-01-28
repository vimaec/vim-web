import { useRef } from 'react'
import { UltraViewer, UltraReact } from '../../vim-web'
import { useUltraNoModel, useUltraWithWolford } from './ultraPageUtils'
import { residence } from '../devUrls'
import { Box3 } from 'three'
import { Vector2, Vector3 } from '../../vim-web/core-viewers/ultra'

export function UltraSectionBox () {
  const div = useRef<HTMLDivElement>(null)

  useUltraNoModel(div, (ultra) => {
    void createSectionBox(ultra)
  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}

async function createSectionBox (ultra: UltraReact.UltraComponentRef) {

  await ultra.viewer.connect()

  ultra.viewer.sectionBox.enabled = true
  

  const request = ultra.load({url:residence})
  const result = await request.getResult()
  if (result.isSuccess) {
    await ultra.viewer.camera.frameAll(0)
    const box = await result.vim.getBoundingBox('all')

    //ultra.viewer.sectionBox.enabled = false
    //ultra.viewer.sectionBox.enabled = true
    ultra.viewer.sectionBox.fitBox(box)


  }
}