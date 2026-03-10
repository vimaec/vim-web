---
name: review-react
description: Review React layer code for common issues like subscription leaks, hooks violations, and pattern inconsistencies. Use when reviewing react-viewers/ files or after making React layer changes.
allowed-tools: Read, Grep, Glob
---

# Review React Layer

Review the specified files (or all of `src/vim-web/react-viewers/` if none specified) for these categories of issues:

## 1. Subscription Leaks
- Every `.subscribe()` and `.sub()` call inside `useEffect` MUST have its return value captured and returned as cleanup
- ste-signals `.sub()` and `.subscribe()` both return unsubscribe functions
- Reference correct pattern from CLAUDE.md "Subscription Cleanup" section

## 2. Resource Leaks
- `ResizeObserver` — must call `.disconnect()` in cleanup
- `setTimeout` — must call `clearTimeout()` in cleanup
- Event listeners — must call `removeEventListener()` in cleanup

## 3. Rules of Hooks Violations
- Any function calling React hooks (useState, useEffect, useRef, useStateRef, etc.) MUST be prefixed with `use`
- Non-hook helper functions must NOT call hooks — use closure variables instead
- The ultra isolation adapter uses closure variables (`let ghost = false`), NOT useStateRef

## 4. StateRef Misuse
- `StateRef<T>` interface only has: `get()`, `set()`, `confirm()`, `onChange`
- `useOnChange()`, `useValidate()`, `useMemo()` are only on the concrete `useStateRef()` return — NOT available through `StateRef<T>` typed variables
- If you need onChange in a useEffect with a `StateRef<T>` typed variable, use `stateRef.onChange.subscribe()`

## 5. useEffect Without Dependencies
- Intentionally depless (OK): `ReactTooltip.rebuild()`, `resizeGfx()` in sidePanel
- NOT OK: State updates like `side.setHasBim(...)` — must use `onChange.subscribe` pattern

## 6. Console.log in Production
- No `console.log` in production code
- `console.error` for actual error handling in catch blocks is OK

## 7. Dead Code
- Unused functions, variables, imports
- eslint-disable comments hiding unused code
- Functions defined but not included in return values

## 8. Copy-paste Bugs
- Duplicate field values (e.g., familyTypeName showing familyName)
- Inverted boolean conditions
- Double assignments (`n = n = value`)
- Stale closures in useState callbacks — use functional updater (`prev => !prev`)

## Output Format

For each issue found, report:
- **File:line** — exact location
- **Category** — which category above
- **Severity** — High/Medium/Low
- **Description** — what's wrong
- **Fix** — how to fix it
