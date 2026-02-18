import { Viewer } from '../viewer'
import { GizmoAxes } from './axes/gizmoAxes'
import { GizmoLoading } from './gizmoLoading'
import { GizmoOrbit } from './gizmoOrbit'
import { IMeasure, Measure } from './measure/measure'
import { SectionBox } from './sectionBox/sectionBox'
import { GizmoMarkers } from './markers/gizmoMarkers'
import { Camera } from '../camera/camera'
import { Renderer } from '../rendering/renderer'
import { Viewport } from '../viewport'

/**
 * Represents a collection of gizmos used for various visualization and interaction purposes within the viewer.
 */
export class Gizmos {
  private readonly _viewport: Viewport

  /**
   * The interface to start and manage measure tool interaction.
   */
  get measure () {
    return this._measure as IMeasure
  }

  private readonly _measure: Measure

  /**
   * The section box gizmo.
   */
  readonly sectionBox: SectionBox

  /**
   * The loading indicator gizmo.
   */
  readonly loading: GizmoLoading

  /**
   * The camera orbit target gizmo.
   */
  readonly orbit: GizmoOrbit

  /**
   * The axis gizmos of the viewer.
   */
  readonly axes: GizmoAxes

  /**
   * The interface for adding and managing sprite markers in the scene.
   */
  readonly markers: GizmoMarkers

  /** @internal */
  constructor (renderer: Renderer, viewport: Viewport, viewer: Viewer, camera : Camera) {
    this._viewport = viewport
    this._measure = new Measure(viewer, renderer)
    this.sectionBox = new SectionBox(renderer, viewer)
    this.loading = new GizmoLoading(viewer)
    this.orbit = new GizmoOrbit(
      renderer,
      camera,
      viewer.inputs,
      viewer.settings
    )
    this.axes = new GizmoAxes(camera, viewport, viewer.settings.axes)
    this.markers = new GizmoMarkers(renderer, viewer.selection)
    viewport.canvas.parentElement?.prepend(this.axes.canvas)
  }

  /** @internal */
  updateAfterCamera () {
    this.axes.update()
  }

  /**
   * Disposes of all gizmos.
   */
  dispose () {
    this._viewport.canvas.parentElement?.removeChild(this.axes.canvas)
    this._measure.clear()
    this.sectionBox.dispose()
    this.loading.dispose()
    this.orbit.dispose()
    this.axes.dispose()
  }
}
