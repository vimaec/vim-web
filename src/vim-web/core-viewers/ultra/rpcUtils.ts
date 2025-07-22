
import * as rpcTypes from "./rpcTypes";
import * as THREE from "three";

export function RGBToThree(color: rpcTypes.RGB): THREE.Color {
  return new THREE.Color(color.r, color.g, color.b);
}

export function RGBAToThree(color: rpcTypes.RGBA): THREE.Color {
  return new THREE.Color(color.r, color.g, color.b);
}

export function RGBA32ToThree(color: rpcTypes.RGBA32): THREE.Color {
  return new THREE.Color(color.r / 255, color.g / 255, color.b / 255);
}

export function RGBfromThree(color: THREE.Color): rpcTypes.RGB {
  return new rpcTypes.RGB(color.r, color.g, color.b);
}

export function RGBAfromThree(color: THREE.Color, opacity: number = 1): rpcTypes.RGBA {
  return new rpcTypes.RGBA(color.r, color.g, color.b, opacity);
}

export function RGBA32fromThree(color: THREE.Color, opacity: number = 1): rpcTypes.RGBA32 {
  return rpcTypes.RGBA32.fromFloats(color.r, color.g, color.b, opacity);
}

