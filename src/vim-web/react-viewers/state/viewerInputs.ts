import { useEffect } from "react";
import { CoreInputHandler } from "../../core-viewers/webgl";
import { CameraRef } from "./cameraState";

// Input binding override for the viewer are defined here.
export function useViewerInput(handler: CoreInputHandler, camera: CameraRef){
  useEffect(() => {
    handler.keyboard.registerKeyUp('KeyF', 'replace', () => camera.frameSelection.call());
  }, [])
}