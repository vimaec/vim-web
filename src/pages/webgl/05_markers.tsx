import React, { useRef } from 'react'
import { useWebglViewer, useWebglViewerWithResidence } from './webglPageUtils'
import * as THREE from 'three'
import * as VIM from '../../vim-web'

export function WebglMarkers () {
  const div = useRef<HTMLDivElement>(null)

  useWebglViewerWithResidence(div, (viewer, vim) =>{
    viewer.controlBar.customize((bar) => 
      [...bar,
        {
          id:'markers',
          buttons: [
            {
              id: 'add_marker',
              icon: VIM.React.Icons.checkmark,
              tip: 'Add Marker',
              action: async () => {
                const box = await viewer.core.selection.getBoundingBox()
                const pos = box.getCenter(new THREE.Vector3())
                viewer.core.gizmos.markers.add(pos)
              }   
            },
            {
              id: 'remove_marker',
              icon: VIM.React.Icons.close,
              tip: 'Remove Marker',
              action: async () => {
                const selectedMarkers = await viewer.core.selection.getAll().filter(e => e.type === 'Marker')
                selectedMarkers.forEach((marker) => viewer.core.gizmos.markers.remove(marker))
              }   
            }
          ],
        }
      ]
    )
  })


  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}
