import { useEffect } from "react";
import { type IInputHandler } from "../../core-viewers/shared";
import { CameraApi } from "./cameraState";

// Input binding override for the viewer are defined here.
export function useViewerInput(handler: IInputHandler, camera: CameraApi){
  useEffect(() => {
    handler.keyboard.override('KeyF', 'up', () => camera.frameSelection.call());
  }, [])
}