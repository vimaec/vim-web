/**
 * @module vim-loader/materials
 *
 * Color palette optimization for submesh colors.
 * Builds a unique color palette from all submeshes to minimize GPU memory usage.
 * If the model has too many unique colors, applies quantization to fit within limits.
 */

import { MappedG3d } from '../progressive/mappedG3d'

const MAX_COLORS = 16384 // 128×128 texture (RGBA)
const QUANTIZATION_LEVELS = 25 // 25³ = 15,625 max colors

export type ColorPaletteResult = {
  palette: Float32Array | undefined
  submeshColor: Uint16Array
  uniqueColorCount: number
}

/**
 * Builds a unique color palette from submesh colors.
 * If uniqueColorCount > MAX_COLORS, quantizes colors in-place in mappedG3d.materialColors.
 *
 * @param mappedG3d - The mapped G3d geometry with material colors
 * @param submeshColorCount - Total number of submeshes
 * @returns Color palette (undefined if too many colors), submesh→colorIndex mapping, and unique color count
 */
export function buildColorPalette(
  mappedG3d: MappedG3d,
  submeshColorCount: number
): ColorPaletteResult {
  // Build unique color palette for shader lookup
  const uniqueColorsMap = new Map<string, number>() // color key → colorIndex
  const colorPaletteArray: number[] = []
  const submeshColor = new Uint16Array(submeshColorCount)

  // First pass: build initial palette
  for (let i = 0; i < submeshColorCount; i++) {
    const color = mappedG3d.getSubmeshColor(i)
    const key = `${color[0].toFixed(6)},${color[1].toFixed(6)},${color[2].toFixed(6)}`

    let colorIndex = uniqueColorsMap.get(key)
    if (colorIndex === undefined) {
      colorIndex = colorPaletteArray.length / 3
      uniqueColorsMap.set(key, colorIndex)
      colorPaletteArray.push(color[0], color[1], color[2])
    }

    submeshColor[i] = colorIndex
  }

  let uniqueColorCount = uniqueColorsMap.size

  // If too many unique colors, quantize them in-place
  if (uniqueColorCount > MAX_COLORS) {
    quantizeColors(mappedG3d.materialColors, QUANTIZATION_LEVELS)

    // Rebuild palette with quantized colors
    uniqueColorsMap.clear()
    colorPaletteArray.length = 0

    for (let i = 0; i < submeshColorCount; i++) {
      const color = mappedG3d.getSubmeshColor(i)
      const key = `${color[0].toFixed(6)},${color[1].toFixed(6)},${color[2].toFixed(6)}`

      let colorIndex = uniqueColorsMap.get(key)
      if (colorIndex === undefined) {
        colorIndex = colorPaletteArray.length / 3
        uniqueColorsMap.set(key, colorIndex)
        colorPaletteArray.push(color[0], color[1], color[2])
      }

      submeshColor[i] = colorIndex
    }

    uniqueColorCount = uniqueColorsMap.size
  }

  // Return palette if within limits, otherwise undefined (disable optimization)
  if (uniqueColorCount <= MAX_COLORS) {
    const palette = new Float32Array(colorPaletteArray)
    return { palette, submeshColor, uniqueColorCount }
  } else {
    return { palette: undefined, submeshColor, uniqueColorCount }
  }
}

/**
 * Quantizes colors in-place using uniform quantization.
 * Modifies the input array directly to avoid allocations.
 *
 * @param colors - Float32Array of RGB colors to quantize in-place
 * @param levels - Number of quantization levels per channel (e.g., 25 = 15,625 max colors)
 */
function quantizeColors(colors: Float32Array, levels: number): void {
  const quantize = (value: number) => Math.round(value * levels) / levels

  for (let i = 0; i < colors.length; i++) {
    colors[i] = quantize(colors[i])
  }
}
