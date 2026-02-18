import { useEffect } from "react";
import { InputHandler } from "../../core-viewers/shared";
import { CameraApi } from "./cameraState";

// Input binding override for the viewer are defined here.
export function useViewerInput(handler: InputHandler, camera: CameraApi){
  useEffect(() => {
    handler.keyboard.registerKeyUp('KeyF', 'replace', () => camera.frameSelection.call());
  }, [])
}