---
name: auto-review
description: Autonomous review-fix-verify loop. Scans code for issues, fixes them, builds, and repeats until clean. Runs without human intervention. Pass a directory or file glob as argument.
---

# Autonomous Review-Fix-Verify Loop

Run an autonomous loop that reviews code, fixes issues, verifies the build, and repeats until no issues remain. No human intervention required.

**Argument**: Directory or file pattern to review (default: `src/vim-web/react-viewers/`)

## Rules — READ THESE FIRST

1. **NEVER use tools that require user approval** — no `Bash` subagent type, no destructive git commands
2. **Use `general-purpose` subagent type** for all Task agents that edit code
3. **Always run `npm run build`** after fixes to verify nothing broke
4. **Stop after 8 rounds** maximum to prevent infinite loops
5. **Stop early** if a round finds 0 issues
6. **Track everything** — round number, issues found, issues fixed, build status

## Loop Structure

```
Round N:
  1. REVIEW  — Read files, identify issues using the checklists below
  2. REPORT  — List all issues with file:line, category, severity, fix
  3. FIX     — Apply fixes (spawn parallel agents for independent fixes)
  4. BUILD   — Run `npm run build`
  5. DECIDE  — If build fails, fix build errors and rebuild
              If no issues were found, STOP
              Otherwise, go to Round N+1
```

## Review Checklist

Scan for these categories (in priority order):

### High Priority
- **Subscription leaks**: `.subscribe()` / `.sub()` in useEffect without cleanup return
- **Resource leaks**: ResizeObserver, setTimeout, addEventListener without cleanup
- **Bugs**: Inverted conditions, copy-paste errors, double assignments, stale closures
- **Rules of Hooks**: Functions calling hooks without `use` prefix

### Medium Priority
- **StateRef misuse**: Calling `useOnChange()` on a `StateRef<T>` typed variable (only exists on concrete `useStateRef()` return)
- **useEffect without deps**: State updates that should use `onChange.subscribe` pattern
- **Import discipline**: React layer must use barrels; core layer must use direct imports
- **Leaked internals**: `@internal readonly` fields that should be `private`

### Low Priority
- **Dead code**: Unused imports, functions, variables
- **console.log**: Remove from production code (`console.error` in catch blocks is OK)
- **Commented-out code**: Delete entirely (git has history)
- **eslint-disable comments**: Remove along with the dead code they hide

## How to Fix

### Parallel Agents
Spawn multiple `general-purpose` Task agents in parallel for independent fixes:

```
Agent 1: Fix subscription leaks in files A, B, C
Agent 2: Fix dead code in files D, E, F
Agent 3: Fix copy-paste bugs in files G, H
```

Each agent prompt should include:
- The exact file paths to modify
- The exact issue description and line numbers
- The exact fix to apply
- Instruction to use Read tool before Edit tool

### Direct Fixes
For simple 1-2 line fixes, edit directly without spawning agents.

### Build Verification
After ALL fixes in a round are applied:
```bash
npm run build
```
If build fails, read the error, fix it, rebuild. Do NOT move to the next round with a broken build.

## Output Format

After each round, output a summary:

```
## Round N Summary
- Issues found: X
- Issues fixed: Y
- Build: PASS/FAIL
- Categories: [list of issue categories found]
- Files modified: [list]
```

After the final round:

```
## Final Report
- Total rounds: N
- Total issues fixed: X
- All files modified: [list]
- Build status: PASS
```

## Known Patterns to Watch For

These are real bugs found in this codebase — check for similar patterns:

| Pattern | Example | Fix |
|---------|---------|-----|
| Missing subscription cleanup | `useEffect(() => { x.onChange.subscribe(fn) }, [])` | `return x.onChange.subscribe(fn)` |
| Stale closure in useState | `setRefresh(!refresh)` | `setRefresh(prev => !prev)` |
| Copy-paste field bug | `value: info.familyName` on familyTypeName row | Use correct field name |
| Inverted condition | `enabled: vis === 'onlySelection'` | `enabled: vis !== 'onlySelection'` |
| Double assignment | `n = n = current.parent` | `n = current.parent` |
| Unused destructured var | `const [_, setState]` | `const [, setState]` |
| Hook in non-hook function | `createFoo() { useState() }` | Rename to `useFoo()` or use closure |
| Control bar double-apply | `controlBarCustom(useControlBar(..., controlBarCustom))` | Pass custom directly to hook |
| Polling instead of events | `setInterval(() => check())` | `addEventListener('change', handler)` |
