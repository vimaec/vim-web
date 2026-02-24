/**
 * @module vim-loader/materials
 *
 * Fixed quantized color palette for all scene coloring.
 *
 * Every color (model materials AND user overrides) maps to a palette index via colorToIndex().
 * The palette is deterministic: 25 levels per RGB channel = 25³ = 15,625 entries,
 * stored in a 128×128 RGBA texture (16,384 slots, 15,625 used).
 *
 * Max color error: ~4% per channel (10.6 steps out of 255) — negligible for BIM.
 */

import { MappedG3d } from '../progressive/mappedG3d'

const LEVELS = 24 // 0..24 inclusive = 25 values per channel
const PALETTE_SIZE = 128 // 128×128 texture

/**
 * Maps an RGB color (0-1 per channel) to a palette index.
 * The index is deterministic: same color always maps to same index.
 */
export function colorToIndex (r: number, g: number, b: number): number {
  const ri = Math.round(r * LEVELS)
  const gi = Math.round(g * LEVELS)
  const bi = Math.round(b * LEVELS)
  return ri * 625 + gi * 25 + bi // 25² = 625
}

/**
 * Builds the fixed 128×128 RGBA palette texture data.
 * Always the same — 15,625 quantized colors.
 */
export function buildPaletteTexture (): Uint8Array {
  const data = new Uint8Array(PALETTE_SIZE * PALETTE_SIZE * 4)
  const total = (LEVELS + 1) * (LEVELS + 1) * (LEVELS + 1) // 15,625

  for (let i = 0; i < total; i++) {
    const ri = Math.floor(i / 625)
    const gi = Math.floor((i % 625) / 25)
    const bi = i % 25

    const offset = i * 4
    data[offset] = Math.round((ri / LEVELS) * 255)
    data[offset + 1] = Math.round((gi / LEVELS) * 255)
    data[offset + 2] = Math.round((bi / LEVELS) * 255)
    data[offset + 3] = 255
  }

  return data
}

/**
 * Maps each submesh to its nearest palette index.
 *
 * @param g3d - The mapped G3d geometry with material colors
 * @param submeshCount - Total number of submeshes
 * @returns Uint16Array mapping submesh index → palette color index
 */
export function buildColorIndices (
  g3d: MappedG3d,
  submeshCount: number
): Uint16Array {
  const indices = new Uint16Array(submeshCount)
  for (let i = 0; i < submeshCount; i++) {
    const color = g3d.getSubmeshColor(i)
    indices[i] = colorToIndex(color[0], color[1], color[2])
  }
  return indices
}
