export interface AxesSettings {
  size: number;
  padding: number;
  bubbleSizePrimary: number;
  bubbleSizeSecondary: number;
  lineWidth: number;
  fontPxSize: number;
  fontFamily: string;
  fontWeight: string;
  fontColor: string;
  className: string;
  colorX: string;
  colorY: string;
  colorZ: string;
  colorXSub: string;
  colorYSub: string;
  colorZSub: string;
}

export function getDefaultAxesSettings() :AxesSettings {
  return{
    size: 84,
    padding: 4,
    bubbleSizePrimary: 8,
    bubbleSizeSecondary: 6,
    lineWidth: 2,
    fontPxSize: 12,
    fontFamily: 'arial',
    fontWeight: 'bold',
    fontColor: '#222222',
    className: 'gizmo-axis-canvas',
    colorX: '#f73c3c',
    colorY: '#6ccb26',
    colorZ: '#178cf0',
    colorXSub: '#942424',
    colorYSub: '#417a17',
    colorZSub: '#0e5490',
  }

};

export function createAxesSettings(
  init?: Partial<AxesSettings>
): AxesSettings {
  return { ...getDefaultAxesSettings(), ...init };
}
