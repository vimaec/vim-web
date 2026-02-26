import * as THREE from 'three'
import { createAxesSettings, getDefaultAxesSettings } from '../gizmos/axes/axesSettings'
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
    skybox: {
      enable: true,
      skyColor: new THREE.Color(0xffffff), // white
      groundColor: new THREE.Color(0xf6f6f6), // less white
      sharpness: 2
    },
    skylight: {
      skyColor: new THREE.Color(0xffffff),
      groundColor: new THREE.Color(0xffffff),
      intensity: 0.8
    },
    sunlights: [
      {
        followCamera: true,
        position: new THREE.Vector3(1000, 1000, 1000),
        color: new THREE.Color(0xffffff),
        intensity: 0.8
      },
      {
        followCamera: true,
        position: new THREE.Vector3(-1000, -1000, -1000),
        color: new THREE.Color(0xffffff),
        intensity: 0.2
      }
    ],
    materials: {
      useFastMaterials: false,
      standard: {
        color: new THREE.Color(0xcccccc)
      },
      ghost: {
        color: new THREE.Color(0x0E0E0E),
        opacity: 7 / 255
      },
      section: {
        strokeWidth: 0.01,
        strokeFalloff: 0.75,
        strokeColor: new THREE.Color(0xf6f6f6)
      },
      outline: {
        intensity: 3,
        color: new THREE.Color(0x00ffff),
        scale: .75
      }
    },
    axes: getDefaultAxesSettings(),
    rendering: {
      autoRender: true
    }
  }
}
