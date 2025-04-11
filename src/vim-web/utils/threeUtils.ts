import * as THREE from 'three'

export function addBox(b1 : THREE.Box3, b2 : THREE.Box3) {
  const r= b1.clone() 
  r.min.x += b2.min.x
  r.min.y += b2.min.y
  r.min.z += b2.min.z
  r.max.x += b2.max.x
  r.max.y += b2.max.y
  r.max.z += b2.max.z
  return r
}

export function subBox(b1 : THREE.Box3, b2 : THREE.Box3) {
  const r= b1.clone() 
  r.min.x -= b2.min.x
  r.min.y -= b2.min.y
  r.min.z -= b2.min.z
  r.max.x -= b2.max.x
  r.max.y -= b2.max.y
  r.max.z -= b2.max.z
  return r
}

export function safeBox(b1 : THREE.Box3){
  if(b1.max.x <= b1.min.x){
    const temp = b1.min.x
    b1.min.x = b1.max.x
    b1.max.x = temp
  }
  if(b1.max.y <= b1.min.y){
    const temp = b1.min.y
    b1.min.y = b1.max.y
    b1.max.y = temp
  }
  if(b1.max.z <= b1.min.z){
    const temp = b1.min.z
    b1.min.z = b1.max.z
    b1.max.z = temp
  }
  return b1
}