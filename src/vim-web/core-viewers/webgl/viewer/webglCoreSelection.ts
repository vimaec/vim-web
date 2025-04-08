/**
 * @module viw-webgl-viewer
 */

import { WebglCoreMarker } from './gizmos/markers/gizmoMarker'
import { WebglCoreModelObject } from '../loader/webglModelObject'
import { CoreSelection, CoreSelectionAdapter } from '../../shared/coreSelection'

export type IWebglCoreSelection = CoreSelection<WebglCoreSelectable>
export type WebglCoreSelectable = WebglCoreModelObject | WebglCoreMarker

export function createWebglCoreSelection() {
  return new CoreSelection<WebglCoreSelectable>(new WebglCoreSelectionAdapter())
} 

export class WebglCoreSelectionAdapter  implements CoreSelectionAdapter<WebglCoreSelectable>{
  outline(object: WebglCoreSelectable, state: boolean): void {
    object.outline = state
  }
}


