import React, { useRef } from 'react'
import { useWebglViewer, useWebglViewerWithResidence } from './webglPageUtils'
import * as THREE from 'three'
import { camera } from '../../vim-web/react-viewers/panels/icons'

export function WebglMarkers () {
  const div = useRef<HTMLDivElement>(null)

  useWebglViewer(div, (viewer) =>{
    //const m1 = viewer.core.gizmos.markers.add(new THREE.Vector3(0, 0, 3))
    //m1.element = 1
    const m2 = viewer.core.gizmos.markers.add(new THREE.Vector3(0, 3, 3))
    m2.element = 2

    
    m2.color = new THREE.Color(0xFF0000)

    viewer.core.camera.lerp(1).frame(m2)

    // Create a basic box geometry
const geometry = new THREE.BoxGeometry(1, 1, 1);

// Create a simple material
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// Create a mesh from geometry and material
const box = new THREE.Mesh(geometry, material);
viewer.core.renderer.add(box)

  })

  return (
    <div ref={div} className='vc-inset-0 vc-absolute'/>
  )
}
