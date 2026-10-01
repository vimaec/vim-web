---
name: auto-refactor
description: Autonomous modernization loop. Refactors code to modern React/TypeScript patterns, tightens APIs, improves architecture, and cleans up. Runs without human intervention. Pass a directory or file glob as argument.
---

# Autonomous Refactor & Modernize Loop

Actively improve and modernize code — not just bug fixes, but structural improvements. Runs autonomously without human intervention.

**Argument**: Directory or file pattern to refactor (default: `src/vim-web/react-viewers/`)

## Rules — READ THESE FIRST

1. **NEVER use tools that require user approval** — no `Bash` subagent type, no destructive git commands
2. **Use `general-purpose` subagent type** for all Task agents that edit code
3. **Always run `npm run build`** after each round to verify nothing broke
4. **Stop after 4 hours** maximum
5. **Stop early** if a round finds nothing worth changing
6. **One theme per round** — don't mix React modernization with API tightening in the same round
7. **Read before edit** — always read a file before modifying it
8. **Be aggressive** — this is REFACTORING, not linting. Structural changes, pattern rewrites, and architectural improvements are the goal. Removing a commented-out line is not refactoring. Rewriting a setState-in-render to useMemo IS refactoring. Extracting a 400-line component into focused hooks IS refactoring. Replacing a manual sync pattern with derived state IS refactoring.

## Aggressiveness Guidelines

The user expects DEEP structural improvements, not surface-level cleanup. Prioritize by impact:

**HIGH IMPACT (always do these):**
- Rewrite anti-patterns: setState in render body → useMemo/derived state
- Replace manual state sync (two useOnChange keeping states in sync) → computed/derived values
- Extract custom hooks from components with multiple independent state+effect bundles
- Fix incorrect return types (function returns null but type says T[])
- Restructure component files > 300 lines into hook + thin render layer
- Replace callback patterns with proper React idioms

**MEDIUM IMPACT (do in later rounds):**
- Extract inline objects to constants
- Fix hook naming violations
- Add cleanup to useEffect
- Replace `as` casts with `satisfies`
- Remove `any` types

**LOW IMPACT (do last or skip):**
- Remove commented-out code
- Remove unused imports
- Remove unused parameters

Do NOT spend an entire round on low-impact changes. Combine them with medium-impact work or handle them as quick fixes between structural rounds.

## Loop Structure

```
Round N:
  1. SCAN    — Read files, identify improvement opportunities
  2. PLAN    — Pick ONE theme for this round, list all changes
  3. APPLY   — Make changes (parallel agents for independent files)
  4. BUILD   — Run `npm run build`
  5. REVIEW  — Spawn independent review agent (see below)
  6. ADAPT   — Use review score + feedback to decide next round's focus
  7. DECIDE  — If score < 85 and improvements remain, go to Round N+1
```

### Independent Review Agent (Step 5)

After each round's build passes, spawn a **separate** `general-purpose` Task agent to evaluate the current state of the modified files. This agent has NO context of what you just changed — it evaluates the code fresh.

**Review agent prompt template:**
```
You are a code quality reviewer. Read the following files and score them 1-100
on overall code quality. You have NO context about recent changes — evaluate
the code as-is.

Files to review: [list of files modified this round + any related files]

Score on these dimensions (each 1-100):
1. **Structural quality** — Are components focused? Are hooks extracted?
   Is derived state computed, not synced? Are anti-patterns present?
2. **Correctness** — Are effects cleaned up? Are types honest?
   Are race conditions guarded? Are resources released?
3. **API design** — Are interfaces tight? Are internals hidden?
   Is the public surface minimal and consistent?
4. **Code hygiene** — Dead code? Unused imports? `any` types?
   Commented-out code? Inconsistent patterns?

For each dimension:
- Give the score
- List the TOP 3 most impactful issues still remaining (with file:line)
- Suggest the specific change that would improve the score most

Final output:
- Overall score: (weighted average: structural 40%, correctness 30%, API 20%, hygiene 10%)
- Top 3 issues to fix next (ranked by impact)
- What theme should the next round focus on?
```

**How to use the review:**
- If overall score >= 85 and no structural issues remain → stop, the code is clean
- If score < 85 → the review's "top 3 issues" and "next theme" recommendation
  OVERRIDE the default theme order. Fix what the reviewer says is worst.
- Track scores across rounds. If a round doesn't improve the score by at least 5 points,
  you're making low-impact changes — switch to a higher-impact theme or stop.

## Round Themes (in priority order)

Work through these themes in order. Each round picks ONE theme and applies it across all relevant files. **Themes 1-4 are structural and HIGH PRIORITY.** Themes 5-8 are mechanical and can be combined or done quickly.

---

### Theme 1: Structural React Rewrites

**Goal**: Fix anti-patterns that affect correctness and architecture. These are the meaty changes.

**setState in render body → derived state:**
```typescript
// BEFORE: setState during render causes double-render
if (!ArrayEquals(props.objects, objects)) {
  setObjects(props.objects)        // ❌ setState in render body
  setExpandedItems([...new Set()])  // ❌ multiple setStates in render
}

// AFTER: derive from props, no setState needed
const expandedItems = useMemo(() => computeExpanded(props.objects, tree), [props.objects, tree])
```

**Manual state sync → computed values:**
```typescript
// BEFORE: two states kept in sync via onChange handlers
const allElements = useStateRef([])
const filteredElements = useStateRef([])
const filter = useStateRef('')
filter.useOnChange(() => applyFilter())
allElements.useOnChange(() => applyFilter())

// AFTER: filteredElements is derived, not stored
const filteredElements = useMemo(() => filterElements(allElements, filter), [allElements, filter])
// Or with StateRef pattern:
const filteredElements = allElements.useMemo((all) => filterElements(all, filter.get()), [filter.get()])
```

**Incorrect return types → fix the contract:**
```typescript
// BEFORE: lies to the type system
function getBody(): Promise<Section[]> {
  if (!data) return null  // ❌ null is not Section[]
}
// AFTER: honest type
function getBody(): Promise<Section[] | null> {
  if (!data) return null  // ✅
}
```

**Extract hooks from bloated components:**
```typescript
// BEFORE: 400-line component with 5 independent state+effect bundles
function BigComponent() {
  const [a, setA] = useState()
  useEffect(() => { /* concern A */ }, [a])
  const [b, setB] = useState()
  useEffect(() => { /* concern B */ }, [b])
  // ... 300 more lines
}

// AFTER: thin component + focused hooks
function useConcernA() { ... }
function useConcernB() { ... }
function BigComponent() {
  const a = useConcernA()
  const b = useConcernB()
  return <div>...</div>
}
```

---

### Theme 2: Subscription & Resource Cleanup

**Goal**: Every resource acquired in a component is properly released.

**Pattern — subscription cleanup:**
```typescript
// ✅ Modern pattern
useEffect(() => {
  const unsub = signal.onChange.subscribe(handler)
  return unsub  // or return () => { unsub1(); unsub2() }
}, [])
```

**Checklist:**
- Every `.subscribe()` and `.sub()` returns its unsubscribe function from useEffect
- `ResizeObserver` → `.disconnect()` in cleanup
- `setTimeout` / `setInterval` → `clearTimeout` / `clearInterval` in cleanup
- `addEventListener` → `removeEventListener` in cleanup
- `MutationObserver` → `.disconnect()` in cleanup
- Polling patterns → replace with event listeners where possible (`fullscreenchange`, `resize`, etc.)

---

### Theme 3: TypeScript Strictness

**Goal**: Reduce `any` usage, tighten types, improve type inference.

| Before | After | Why |
|--------|-------|-----|
| `any` type | Proper type or `unknown` | Type safety |
| `as Type` where inferred | Remove assertion | Redundant |
| `object` type | Specific interface | Better autocomplete |
| `Function` type | `() => void` or specific signature | Callable type safety |
| Optional chain where value is always present | Remove `?` | Documents certainty |
| `!` non-null assertions | Proper null check or redesign | Safer |
| `enum` for simple unions | `type Foo = 'a' \| 'b'` | Smaller bundle, better inference |
| `interface` with single implementation | Consider removing if only used internally | Less indirection |

---

### Theme 4: API Surface Tightening

**Goal**: Public APIs expose only what consumers need.

**Process per class/module:**
1. Read the class — list ALL public members
2. Categorize: user-facing vs framework-managed vs internal
3. Create/update interface with only user-facing members
4. Update public getters to return interface type
5. Change `@internal readonly` to `private`
6. Verify `.d.ts` output

**Patterns:**
```typescript
// Gizmo pattern — interface + private concrete
export interface IGizmoFoo {
  enabled: boolean
  doThing(): void
}
// Getter returns interface
get foo(): IGizmoFoo { return this._foo }

// Delegation pattern — hide adapter
export interface FooApi {
  doThing(): void          // ✅ delegates internally
  // adapter: Ref<IFoo>   // ❌ never expose adapter
}

// Private over @internal
private readonly _renderer: Renderer    // ✅ hidden from .d.ts
/** @internal */ readonly _r: Renderer  // ❌ visible in .d.ts
```

---

### Theme 5: Import & Module Organization

**Goal**: Clean import graph, proper barrel usage, no circular dependencies.

**Rules:**
- **React layer** (`react-viewers/`): Import through barrel files (`import * as Core from '../../core-viewers'`)
- **Core layer** (`core-viewers/`): Import directly from source files, NEVER through barrels
- No cross-viewer imports (ultra importing from `../webgl` is wrong)
- Shared types go in `state/` or `helpers/`, not in viewer-specific directories
- Remove unused imports
- Sort/group imports: external → core → relative

---

### Theme 6: Component Decomposition

**Goal**: Break large components into focused, reusable pieces.

**Signals to decompose:**
- Component file > 300 lines
- Multiple `useState` + `useEffect` blocks managing independent concerns
- Deeply nested JSX (>4 levels)
- Multiple responsibilities in one component

**How to decompose:**
- Extract custom hooks for state + effect bundles (`useIsolation`, `useSectionBox`)
- Extract sub-components for repeated JSX patterns
- Move business logic to hooks, keep components as thin render layers

---

### Theme 7: Performance Patterns

**Goal**: Apply performance best practices without premature optimization.

| Before | After | Why |
|--------|-------|-----|
| `new Vector3()` in render/frame loop | Static reusable vector | GC pressure |
| Inline `style={{}}` in JSX | Module-level constant or `useMemo` | Re-render stability |
| Re-creating objects every render | `useMemo` with proper deps | Reference stability |
| Large component re-rendering for small changes | `React.memo` on leaf components | Reduce re-renders |
| Expensive computation in render | `useMemo` | Avoid redundant work |

**Do NOT:**
- Add `React.memo` everywhere — only where profiling shows benefit
- Add `useCallback` to every handler — only when passed as props to memoized children
- Over-memoize — the cure can be worse than the disease

---

### Theme 8: Dead Code & Cruft Removal

**Goal**: Clean slate. Remove everything that isn't earning its keep.

- Unused imports, functions, variables, types
- `console.log` statements (keep `console.error` in catch blocks)
- Commented-out code (git has history)
- `eslint-disable` comments hiding dead code
- Empty files with no meaningful content
- `var` declarations → `const` or `let`
- Redundant type assertions
- Backwards-compatibility shims nobody uses

---

## How to Apply Changes

### Parallel Agents
Spawn multiple `general-purpose` Task agents for independent file groups:

```
Agent 1: Modernize hooks in files A, B, C
Agent 2: Modernize hooks in files D, E, F
```

Each agent prompt MUST include:
- Exact file paths
- The theme and what to look for
- Specific examples of before/after patterns
- Instruction to Read before Edit

### Build Verification
After ALL changes in a round:
```bash
npm run build
```
If build fails → fix → rebuild. Never proceed with broken build.

## Output Format

After each round:

```
## Round N: [Theme Name]
- Files modified: [list]
- Build: PASS/FAIL
- Notable changes:
  - file.ts: description of change
  - file.ts: description of change

### Review Score
- Structural: XX/100
- Correctness: XX/100
- API design: XX/100
- Hygiene: XX/100
- **Overall: XX/100** (delta from previous: +/-N)
- Top issues remaining: [from reviewer]
- Next round focus: [from reviewer]
```

Final summary:

```
## Refactoring Complete
- Total rounds: N
- Score progression: [R1: XX → R2: XX → R3: XX → ...]
- Final score: XX/100
- Themes applied: [list]
- Total files modified: X
- Build status: PASS
- Remaining opportunities: [anything the reviewer still flagged]
```
