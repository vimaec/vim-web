/**
 * @module viw-webgl-viewer
 */

import * as THREE from 'three'
import { WebglCoreViewerSettings } from '../settings/webglCoreViewerSettings'
import { ICamera } from '../camera/ICamera'
import { ViewerMaterials } from '../../loader/materials/viewerMaterials'
import { Skybox } from './skybox'
import { WebglCoreRenderer } from '../rendering/webglCoreRenderer'
import { CameraLight } from './cameraLight'
/**
 * Manages ground plane and lights that are part of the THREE.Scene to render but not part of the Vims.
 */
export class Environment {
  private readonly _renderer: WebglCoreRenderer
  private readonly _camera: ICamera

  /**
   * The skylight in the scene.
   */
  readonly skyLight: THREE.HemisphereLight

  /**
   * The array of directional lights in the scene.
   */
  readonly sunLights: ReadonlyArray<CameraLight>

  /*
   * The skybox in the scene.
   */
  readonly skybox: Skybox

  constructor (camera:ICamera, renderer: WebglCoreRenderer, viewerMaterials: ViewerMaterials, settings: WebglCoreViewerSettings) {
    this._camera = camera
    this._renderer = renderer

    this.skyLight = this.createSkyLight(settings)
    this.skybox = new Skybox(camera, renderer, viewerMaterials, settings)
    this.sunLights = this.createSunLights(settings)

    this.addObjectsToRenderer()
  }

  /**
   * Returns all three objects composing the environment
   */
  private getObjects (): ReadonlyArray<THREE.Object3D> {
    return [this.skyLight, ...this.sunLights.map(l => l.light), this.skybox.mesh]
  }

  private createSkyLight (settings: WebglCoreViewerSettings): THREE.HemisphereLight {
    const { skyColor, groundColor, intensity } = settings.skylight
    return new THREE.HemisphereLight(skyColor, groundColor, intensity * Math.PI)
  }

  private createSunLights (settings: WebglCoreViewerSettings): ReadonlyArray<CameraLight> {
    return settings.sunlights.map((s) =>
      new CameraLight(this._camera, s)
    )
  }

  private addObjectsToRenderer (): void {
    this.getObjects().forEach((o) => this._renderer.add(o))
  }

  /**
   * Dispose of all resources.
   */
  dispose (): void {
    this.getObjects().forEach((o) => this._renderer.remove(o))
    this.sunLights.forEach((s) => s.dispose())
    this.skyLight.dispose()
    this.skybox.dispose()
  }
}
