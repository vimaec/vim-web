import dts from 'rollup-plugin-dts'

export default {
  input: 'dist/types/bim-types.d.ts',
  output: {
    file: 'dist/vim-bim.d.ts',
    format: 'es',
  },
  plugins: [
    dts({
      // Inline vim-format so the BIM types are fully self-contained
      includeExternal: ['vim-format'],
    }),
  ],
  external: [
    /\.css$/,
  ],
}
