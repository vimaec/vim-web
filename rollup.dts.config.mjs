import dts from 'rollup-plugin-dts'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = dirname(fileURLToPath(import.meta.url))

export default {
  input: 'dist/types/index.d.ts',
  output: {
    file: 'dist/vim-web.d.ts',
    format: 'es',
  },
  plugins: [
    // Skip CSS imports
    {
      name: 'skip-css',
      resolveId(source) {
        if (source.endsWith('.css')) return { id: source, external: true }
        return null
      },
    },
    // Inline vim-html-ds types. The DS is a path-aliased git submodule, not a package consumers
    // install, so the public d.ts must never import from it — resolve the alias to the built
    // declarations so rollup-plugin-dts bundles them (see DS_PORT.md).
    {
      name: 'inline-vim-html-ds',
      resolveId(source) {
        if (source.startsWith('vim-html-ds/')) {
          return join(root, source.replace(/\.js$/, '.d.ts'))
        }
        return null
      },
    },
    dts({
      // Inline these so the d.ts is self-documenting (no opaque external types)
      includeExternal: ['ste-signals', 'ste-simple-events', 'ste-events', 'ste-core'],
    }),
    // Fix broken self-referential imports from ste-signals.
    // ste-signals' ISignal.d.ts has `import { ISignalHandler } from '.'` which
    // rollup-plugin-dts can't resolve. Patch the output to remove the broken
    // import and inject the missing type definition.
    {
      name: 'fix-ste-signals',
      renderChunk(code) {
        // Remove the broken import
        code = code.replace(/^import \{ ISignalHandler \} from '\.';\n/m, '')
        // If ISignalHandler is referenced but not defined, inject it
        if (code.includes('ISignalHandler') && !code.includes('interface ISignalHandler')) {
          // ISignalHandler is (ev: IEventManagement) => void
          const definition = 'interface ISignalHandler {\n    (ev: IEventManagement): void;\n}\n'
          // Insert before first usage
          code = code.replace(
            /^(interface ISignal)/m,
            definition + '\n$1'
          )
        }
        return code
      },
    },
    // Replace opaque index_d$N namespace names with semantic names.
    // rollup-plugin-dts generates index_d, index_d$1, ... for namespaces.
    // We detect each namespace's identity from its exported content.
    {
      name: 'fix-namespace-names',
      renderChunk(code) {
        const nameMap = new Map()

        // Detect each namespace by peeking at its first export line
        // Suffixes are base36 ($1..$9, then $a, $b, …) — accept letters, not just digits
        for (const m of code.matchAll(/declare namespace (index_d(?:\$[0-9a-z]+)?) \{/g)) {
          const id = m[1]
          const peek = code.substring(m.index, m.index + 500)
          // Names match the access path: Core.Webgl → Core_Webgl, React.Ultra → React_Ultra
          // DS-based layer (dom-viewers) first: its barrels re-export pure React-era modules
          // (contextMenuIds, …), so the React markers below would claim them (see DS_PORT.md).
          if (peek.includes('_bimPanel as bimPanel')) nameMap.set(id, 'Dom_Bim')
          else if (peek.includes('CheckboxOptions')) nameMap.set(id, 'Dom_Components')
          else if (peek.includes('_controlBar as controlBar')) nameMap.set(id, 'Dom_ControlBar')
          else if (peek.includes('_genericPanel as genericPanel')) nameMap.set(id, 'Dom_Generic')
          else if (peek.includes('_isolationPanel as isolationPanel')) nameMap.set(id, 'Dom_Panels')
          else if (peek.includes('_modal as modal')) nameMap.set(id, 'Dom_Modal')
          else if (peek.includes('_settingsPanel as settingsPanel')) nameMap.set(id, 'Dom_Settings')
          // getErrorMessage is unique to the DS errors barrel; the React one also exports webglFileError.
          else if (peek.includes('_getErrorMessage as getErrorMessage')) nameMap.set(id, 'Dom_Errors')
          else if (peek.includes('_createSideState as createSideState')) nameMap.set(id, 'Dom_State')
          else if (peek.includes('childScope')) nameMap.set(id, 'Dom')
          // Core / React
          else if (peek.includes('createCoreWebglViewer')) nameMap.set(id, 'Core_Webgl')
          else if (peek.includes('createCoreUltraViewer')) nameMap.set(id, 'Core_Ultra')
          else if (peek.includes('createWebglViewer')) nameMap.set(id, 'React_Webgl')
          else if (peek.includes('createUltraViewer')) nameMap.set(id, 'React_Ultra')
          else if (peek.includes('PointerMode')) nameMap.set(id, 'Core')
          else if (peek.includes('controlBarIds')) nameMap.set(id, 'React_ControlBar')
          else if (peek.includes('isFalse')) nameMap.set(id, 'React_Settings')
          else if (peek.includes('errorStyle')) nameMap.set(id, 'React_Errors')
          else if (peek.includes('contextMenuIds')) nameMap.set(id, 'React_ContextMenu')
          // Content-based detection where the expected name is fragile: the React barrel is
          // only the bare `index_d` while it happens to deconflict first, and Core.Ultra's
          // `createCoreUltraViewer` sorts past the 500-char peek.
          else if (peek.includes(' as ContextMenu,')) nameMap.set(id, 'React')
          else if (peek.includes('INVALID_HANDLE')) nameMap.set(id, 'Core_Ultra')
        }

        // Bare index_d is the React top-level namespace
        if (!nameMap.has('index_d') && code.includes('declare namespace index_d {')) {
          nameMap.set('index_d', 'React')
        }

        // Fix file-derived namespace names (icons.tsx → icons_d, style.ts → style_d)
        nameMap.set('icons_d', 'React_Icons')
        nameMap.set('iconSet_d', 'Dom_Icons')
        nameMap.set('errorText_d', 'Dom_Errors_Style')
        nameMap.set('style_d', 'React_ControlBar_Style')
        nameMap.set('errorStyle_d', 'React_Errors_Style')

        // Replace longest names first (index_d$10 before index_d$1 before index_d)
        // Use \b prefix to prevent style_d matching inside errorStyle_d
        const sorted = [...nameMap.entries()].sort((a, b) => b[0].length - a[0].length)
        for (const [from, to] of sorted) {
          const escaped = from.replace(/\$/g, '\\$')
          code = code.replace(new RegExp('\\b' + escaped + '(?![\\$0-9a-z])', 'g'), to)
        }
        return code
      },
    },
    // Strip namespace alias noise generated by rollup-plugin-dts.
    // For each namespace, dts generates standalone aliases like:
    //   type Core_Webgl_IFoo = IFoo;
    //   declare const Core_Webgl_Bar: typeof Bar;
    // and re-exports them as:
    //   export { Core_Webgl_IFoo as IFoo, Core_Webgl_Bar as Bar };
    // This plugin removes the standalone aliases and simplifies
    // re-exports to reference the original names directly.
    {
      name: 'strip-namespace-aliases',
      renderChunk(code) {
        // Collect all alias names (not namespace names) from standalone declarations
        const aliases = new Set()
        for (const m of code.matchAll(/^type ((?:Core|React|Dom)_\w+)/gm)) {
          aliases.add(m[1])
        }
        for (const m of code.matchAll(/^declare const ((?:Core|React|Dom)_\w+):/gm)) {
          aliases.add(m[1])
        }

        // Remove standalone type alias lines
        code = code.replace(/^type (?:Core|React|Dom)_\w+[^;]*;\n/gm, '')
        // Remove standalone const alias lines
        code = code.replace(/^declare const (?:Core|React|Dom)_\w+: typeof \w+;\n/gm, '')

        // In export blocks, replace known aliases with direct references:
        // "Core_Webgl_IFoo as IFoo" → "IFoo"
        // Namespace references like "Core_Ultra as Ultra" are NOT in aliases set, so kept
        code = code.replace(/(?:Core|React|Dom)_\w+ as (\w+)/g, (match, realName) => {
          const aliasName = match.split(' as ')[0]
          return aliases.has(aliasName) ? realName : match
        })

        return code
      },
    },
  ],
  external: [
    'three',
    'react',
    'react-dom',
    'deepmerge',
    'vim-format',
    /\.css$/,
  ],
}
