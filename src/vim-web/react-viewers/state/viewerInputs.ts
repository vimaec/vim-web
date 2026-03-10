import { useEffect } from "react";
import { type IInputHandler } from "../../core-viewers/shared";
import { FramingApi } from "./cameraState";

// Input binding override for the viewer are defined here.
export function useViewerInput(handler: IInputHandler, framing: FramingApi){
  useEffect(() => {
    handler.keyboard.override('KeyF', 'up', () => framing.frameSelection.call());
  }, [])
}