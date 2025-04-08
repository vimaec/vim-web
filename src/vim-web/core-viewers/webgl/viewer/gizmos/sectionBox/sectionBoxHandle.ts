import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { WebglCoreCamera, ICamera } from '../../camera/camera';
export type Axis = 'x' | 'y' | 'z';

export class SectionBoxHandle extends THREE.Mesh {
  readonly axis : Axis
  readonly sign: number;
  private _forward: THREE.Vector3;

  private _color: THREE.Color;
  private _highlightColor: THREE.Color;
  
  private _materials: THREE.MeshBasicMaterial[];

  private _camera : ICamera | undefined
  private _camSub : () => void

  constructor(axes: Axis, sign: number, size: number, color?: THREE.Color) {

    const geo = createDoubleCone(size);

    // Set two pass draw for when the handle is behind other objects
    geo.clearGroups();
    geo.addGroup(0, Infinity, 0); 
    geo.addGroup(0, Infinity, 1);

    const matBehind = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.5,
      color: color ?? new THREE.Color(0x000000),
      depthTest: false,
      side: THREE.FrontSide
    });

    const matAlways = new THREE.MeshBasicMaterial({
      color: color ?? new THREE.Color(0x000000),
      side: THREE.FrontSide
    });

    super(geo, [matAlways, matBehind]);
    this._materials = [matAlways, matBehind];
    
    this._forward = new THREE.Vector3();
    this.forward[axes] = sign;
    this.axis = axes;
    this.sign = sign;

    this._color = color ?? new THREE.Color(0x000000);
    this._highlightColor = this._color.clone().lerp(new THREE.Color(0xcccccc), 0.8);
    this.userData.handle = this;
    this.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), this._forward);
  }

  trackCamera(camera: ICamera) {
    this._camera = camera
    this.update()
    this._camSub = camera.onMoved.subscribe(() => this.update());
  }

  update(){
    if(!this._camera) return;
    const size = this._camera.frustrumSizeAt(this.position);
    this.scale.set(size.x * 0.003, size.x * 0.003, size.x * 0.003);
  }

  setPosition(position: THREE.Vector3) {
    this.position.copy(position);
    this.update();
  }

  get forward() {
    return this._forward;
  }

  highlight(value: boolean) {
    this.material[0].color.set(value ? this._highlightColor : this._color);
    this.material[1].color.set(value ? this._highlightColor : this._color);
  }

  dispose() {
    this.geometry.dispose();
    this._materials.forEach(m => m.dispose());
    this._camSub?.();
  }
}

function createDoubleCone(size: number){
  const coneHeight = 2 * size;

  // Create cone facing outwards
  const cone1 = new THREE.ConeGeometry(size, coneHeight, 12);
  cone1.translate(0, coneHeight * 0.75, 0);

  // Create cone facing inwards
  const cone2 = new THREE.ConeGeometry(size, coneHeight, 12);
  cone2.rotateZ(Math.PI); // Rotate to face opposite direction
  cone2.translate(0, -coneHeight *0.75, 0);

  // Merge the two cones into a single geometry
  const mergedGeo = mergeGeometries([cone1, cone2]);
  cone1.dispose();
  cone2.dispose();

  return mergedGeo
}