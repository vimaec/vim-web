---
name: build-check
description: Build the project and verify the output. Use after making changes to confirm everything compiles and the .d.ts declarations are correct.
disable-model-invocation: true
---

# Build and Verify

Run the full build pipeline and verify the output.

## Steps

1. **Build**: Run `npm run build` which executes:
   - `vite build` — production bundle
   - `tsc -p tsconfig.types.json` — TypeScript declarations

2. **Check for errors**: If the build fails, identify the error, fix it, and rebuild.

3. **Verify .d.ts output** (if $ARGUMENTS specifies a type to check):
   - Look in `dist/` for the declaration files
   - Verify that internal/private members do NOT appear in the public API surface
   - Verify that expected public types ARE exported

4. **Report results**:
   - Build pass/fail
   - Bundle size changes (if notable)
   - Any declaration issues found
