import { WebglViewer } from '../viewer'
import { GizmoAxes, IGizmoAxes } from './axes/gizmoAxes'
import { GizmoOrbit, IGizmoOrbit } from './gizmoOrbit'
import { IMeasure, Measure } from './measure/measure'
import { IWebglSectionBox, SectionBox } from './sectionBox/sectionBox'
import { GizmoMarkers, type IGizmoMarkers } from './markers/gizmoMarkers'
import { Camera } from '../camera/camera'
import { Renderer } from '../rendering/renderer'
import { Viewport } from '../viewport'

/**
 * Public interface for the gizmo collection.
 * Exposes only the members needed by API consumers.
 */
export interface IGizmos {
  /** The interface to start and manage measure tool interaction. */
  readonly measure: IMeasure
  /** The section box gizmo. */
  readonly sectionBox: IWebglSectionBox
  /** The camera orbit target gizmo. */
  readonly orbit: IGizmoOrbit
  /** The axis gizmos of the viewer. */
  readonly axes: IGizmoAxes
  /** The interface for adding and managing sprite markers in the scene. */
  readonly markers: IGizmoMarkers
}

/**
 * @internal
 * Represents a collection of gizmos used for various visualization and interaction purposes within the viewer.
 */
export class Gizmos implements IGizmos {
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

  constructor (renderer: Renderer, viewport: Viewport, viewer: WebglViewer, camera : Camera) {
    this._viewport = viewport
    this._measure = new Measure(viewer, renderer)
    this.sectionBox = new SectionBox(renderer, viewer)
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
    this.orbit.dispose()
    this.axes.dispose()
  }
}
