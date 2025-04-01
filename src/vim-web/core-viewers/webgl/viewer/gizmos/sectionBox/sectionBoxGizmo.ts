import * as THREE from 'three'
import { SectionBoxMesh } from './SectionBoxMesh'
import { SectionBoxOutline } from './sectionBoxOutline'
import { SectionBoxHandles } from './sectionBoxHandles'
import { WebglCoreRenderer } from '../../rendering/webglCoreRenderer'
import { Camera, ICamera } from '../../camera/camera'

export class SectionBoxGizmo
{
    private _renderer: WebglCoreRenderer
    readonly cube: SectionBoxMesh
    readonly outline: SectionBoxOutline
    readonly handles: SectionBoxHandles

    private _visible : boolean = false

    get visible() { return this._visible }
    set visible(value: boolean){
      this._visible = value
      this.cube.visible = value
      this.outline.visible = value
      this.handles.visible = value
    }

    constructor(renderer: WebglCoreRenderer, camera: ICamera)
    {
        this._renderer = renderer
        this.cube = new SectionBoxMesh()
        this.outline = new SectionBoxOutline(new THREE.Color(0x878a91))
        this.handles = new SectionBoxHandles(camera)

        this._renderer.add(this.outline)
        this._renderer.add(this.handles.meshes)
        this.visible = false
    }

    fitBox(box: THREE.Box3){
      this.cube.fitBox(box)
      this.outline.fitBox(box)
      this.handles.fitBox(box)
    }

    dispose(){
      this._renderer.remove(this.cube)
      this._renderer.remove(this.outline)
      this._renderer.remove(this.handles.meshes)

      this.cube.dispose()
      this.outline.dispose()
      this.handles.dispose()
    }
}