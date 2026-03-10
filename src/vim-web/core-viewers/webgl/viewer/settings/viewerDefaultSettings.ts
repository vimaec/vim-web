import * as THREE from 'three'
import { getDefaultAxesSettings } from '../gizmos/axes/axesSettings'
import { ViewerSettings } from './viewerSettings'

/**
 * Defines the default values for the VIM Viewer settings.
 */
export function getDefaultViewerSettings(): ViewerSettings {
  return {
    canvas: {
      id: undefined,
      resizeDelay: 200
    },
    camera: {
      orthographic: false,
      lockMovement: new THREE.Vector3(1, 1, 1),
      lockRotation: new THREE.Vector2(1, 1),
      near: 0.001,
      far: 15000,
      fov: 50,
      zoom: 1,
      // 45 deg down looking down z.
      forward: new THREE.Vector3(1, -1, -1),
      controls: {
        orbit: true,
        rotateSpeed: 1,
        orbitSpeed: 1,
        moveSpeed: 1,
        scrollSpeed: 1.75
      },
  
      gizmo: {
        enable: true,
        size: 0.01,
        color: new THREE.Color(0x0590cc),
        colorHorizontal: new THREE.Color(0x58b5dd),
        opacity: 0.5,
        opacityAlways: 0.1
      }
    },
    background: { color: new THREE.Color(0xffffff) },
    materials: {
      ghost: {
        color: new THREE.Color(0x0E0E0E),
        opacity: 7 / 255
      },
      outline: {
        opacity: 0.85,
        color: new THREE.Color(0x00ffff),
        scale: 2,
        thickness: 3
      },
      selection: {
        fillMode: 'none',
        color: new THREE.Color(0x0064ff),
        opacity: 0.3,
        overlayOpacity: 0.25
      }
    },
    axes: getDefaultAxesSettings(),
    rendering: {
      autoRender: true
    }
  }
}
