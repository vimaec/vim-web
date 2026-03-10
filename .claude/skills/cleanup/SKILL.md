---
name: cleanup
description: Remove dead code, unused imports, console.log statements, and other cruft from the specified files or directory. Use for routine code hygiene.
---

# Code Cleanup

Clean up the specified files (or directory) by removing cruft. Always read files before editing.

## What to Remove

1. **Unused imports** — imports that are not referenced anywhere in the file
2. **console.log** — remove from production code; `console.error` in catch blocks is OK
3. **Dead functions** — defined but never called or exported
4. **Dead variables** — assigned but never read
5. **eslint-disable comments** — remove along with the dead code they were hiding
6. **Commented-out code blocks** — delete entirely (git has history)
7. **Empty files** — files with no meaningful content
8. **Redundant type assertions** — `as Type` where the type is already inferred
9. **`var` declarations** — change to `let` or `const`

## What NOT to Remove

- `console.error` in error handling
- Intentionally empty implementations with `_`-prefixed params (e.g., `(_enabled: boolean) => {}`)
- Re-exports in barrel files (even if they look unused locally)
- Type-only exports (`export type *`)

## Process

1. Read each target file
2. Identify items to remove from the list above
3. Make edits
4. Run `npm run build` to verify nothing broke
5. Report what was removed

## Verification

Always run `npm run build` after cleanup to catch any accidental removal of used code.
