import { useEffect } from "react";
import { GeneralInputHandler } from "../../core-viewers/webgl";
import { CameraRef } from "./cameraState";

// Input binding override for the viewer are defined here.
export function useViewerInput(handler: GeneralInputHandler, camera: CameraRef){
  useEffect(() => {
    handler.keyboard.registerKeyUp('KeyF', 'replace', () => camera.frameSelection.call());
  }, [])
}