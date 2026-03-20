---
name: css
description: CSS best practices reference for writing and reviewing CSS/Tailwind. Covers general patterns, AI-friendliness, modern features, performance, accessibility, and this project's conventions. Use when writing, reviewing, or refactoring CSS.
allowed-tools: Read, Grep, Glob, Edit, Write, Agent
---

# CSS Best Practices

Reference guide for writing, reviewing, and refactoring CSS in this project. Apply these rules when touching `style.css`, Tailwind classes in TSX files, or CSS custom properties.

---

## Project-Specific Conventions

This project uses **Tailwind CSS v3** with the `vc-` prefix, CSS custom properties with `--c-` prefix, and a single `style.css` file for global styles + tokens.

> **Full styling reference**: See [STYLING.md](../../docs/STYLING.md) for the complete token system, panel architecture, `vim-hidden` pattern, third-party override conventions, and code style rules.

### Token Hierarchy
```
Primitives (--c-primary, --c-dark-gray, --gap-xs, --z-ui …)
  → used directly in style.css rules and Tailwind config
```

### Token Rules
- All Tailwind classes MUST use the `vc-` prefix: `vc-flex`, `vc-p-4`, `hover:vc-bg-blue-500`
- Never mix prefixed and non-prefixed Tailwind classes
- CSS custom properties use `--c-` prefix for colors: `--c-primary`, `--c-dark-gray-cool`
- Responsive/state variants go before the prefix: `sm:vc-flex`, `hover:vc-opacity-100`
- Inline Tailwind classes in TSX are preferred over @apply for component-specific styles
- Extract React components instead of creating @apply abstractions
- **Zero values**: always bare `0`, never `0px` — the unit is ignored on zero and `0px` is inconsistent
- **Gap values**: use `var(--gap-xs)` (4px) or `var(--gap-sm)` (10px) — never raw `4px`, `8px`, `0.25rem`, `0.5rem`
- **Magic numbers**: add an inline comment when a value isn't self-evident (e.g. `/* chevron size */`, `/* 33% label / 67% value split */`)

---

## 1. AI-Friendly CSS Patterns

LLMs cannot render CSS — they infer visual outcomes. Structure CSS to minimize ambiguity.

### Do
- **Colocate styles with components** — Tailwind inline classes keep full context in one file
- **Use flat, single-class selectors** — each class does one thing, no cascade surprises
- **Use constrained vocabularies** — Tailwind utilities are a predictable API
- **Make cascade explicit** — use `@layer` declarations to spell out priority order
- **One styling approach per component** — don't mix inline styles, CSS classes, and Tailwind
- **Use semantic token names** — `--c-primary` not `--c-blue-hex`

### Don't
- **Rely on implicit inheritance chains** — `.form .input .label` requires tracing up the DOM
- **Use ambiguous class names** — `.container`, `.wrapper`, `.inner` mean nothing to an LLM
- **Scatter related styles across files** — forces massive context to reason about a single component
- **Use deeply nested selectors** — `.a .b .c .d .e` is unpredictable

### Why This Matters
- Utility-first is the most AI-friendly approach: full context in one file, constrained vocabulary, no cascade
- CSS Modules are second-best: scoped by default, standard CSS syntax, no global side effects
- Global CSS files are worst: require cross-file context, implicit cascade, naming ambiguity

---

## 2. Specificity Management

### Cascade Layers (`@layer`)
Layers define explicit precedence that overrides specificity entirely.

```css
@layer reset, base, tokens, components, utilities, overrides;

@layer components {
  .card { padding: 1rem; }
}
@layer utilities {
  .hidden { display: none; }  /* always beats .card even though same specificity */
}
```

### Rules
- Keep all selectors at the same specificity level (single class = `0,1,0`)
- Never use IDs for styling
- Never use `!important` except in utility layers (and even then, sparingly)
- Avoid deeply nested selectors — if you need nesting, limit to 2–3 levels max

---

## 3. CSS Custom Properties

### Three-Tier Token Pattern
```css
/* Tier 1: Primitive tokens */
:root { --color-blue-600: #0052CC; }

/* Tier 2: Semantic tokens */
:root { --c-interactive: var(--color-blue-600); }

/* Tier 3: Component tokens (private, --_ prefix) */
.button { --_button-bg: var(--c-interactive); background: var(--_button-bg); }
```

### Rules
- Never use raw hex/rgb values in component CSS — always go through tokens
- Set at `:root` for global scope, on selectors for scoped overrides
- Use `--_` prefix for private/internal component tokens
- Theme switching should only redefine primitive tokens

---

## 4. Layout

### Grid vs Flexbox
- **Grid**: page/section-level 2D layouts (dashboards, page structures)
- **Flexbox**: component-level 1D alignment (toolbars, button groups, centering)
- Combine them: Grid for structure, Flexbox inside grid cells for alignment

### Responsive Patterns
```css
/* Fluid typography */
font-size: clamp(1rem, 2vw + 0.5rem, 1.5rem);

/* Breakpoint-less grid */
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));

/* Container queries > media queries for components */
.card-container { container-type: inline-size; }
@container (min-width: 400px) {
  .card { display: grid; grid-template-columns: 1fr 2fr; }
}
```

### Logical Properties
Prefer `margin-inline`, `padding-block` over directional properties for i18n support.

---

## 5. Performance

### Critical Rules
- **Animate only compositor properties**: `transform`, `opacity`, `filter`, `clip-path` — GPU-accelerated, no layout/paint
- **Never animate**: `width`, `height`, `margin`, `padding`, `top`, `left` — trigger full layout recalculation
- **Use `contain`** on independent sections:
  ```css
  .sidebar { contain: layout; }    /* 50-70% layout calc improvement */
  .card { contain: paint; }        /* reduces paint areas up to 80% */
  .widget { contain: content; }    /* layout + paint */
  ```
- **Use `will-change` sparingly** — promotes to GPU layer, remove after animation completes
- **Avoid layout thrashing** in JS — batch DOM reads before writes

### Animation Guidelines
- CSS transitions/animations over JavaScript when possible
- Keep animations 200–500ms for micro-interactions
- Use `ease-out` for entries, `ease-in` for exits
- Always provide `prefers-reduced-motion` alternatives

---

## 6. Accessibility

### Focus
```css
:focus-visible {
  outline: 2px solid var(--c-primary);
  outline-offset: 2px;
}
:focus:not(:focus-visible) {
  outline: none;
}
```

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### General
- Minimum touch target: 44x44px
- Use `rem`/`em` for font sizes, not `px`
- Color contrast: WCAG AA = 4.5:1 for text, 3:1 for large text
- Focus indicators need 3:1 contrast against background

---

## 7. Dark Mode

### Recommended: Data Attribute + CSS Variables
```css
:root, [data-theme="light"] { --c-bg: #ffffff; --c-text: #111; }
[data-theme="dark"] { --c-bg: #111; --c-text: #eee; }
```

### Rules
- Never mix hardcoded colors with tokens — use variables everywhere
- Set `color-scheme: light dark` for native element adaptation (scrollbars, form inputs)
- The new `light-dark()` function is another option:
  ```css
  :root { color-scheme: light dark; }
  body { background: light-dark(#fff, #111); }
  ```

---

## 8. Modern CSS Features to Adopt

### Container Queries (90%+ support)
Component-level responsiveness based on container width, not viewport.
```css
.panel { container-type: inline-size; }
@container (min-width: 400px) { .panel-content { flex-direction: row; } }
```

### `:has()` Selector (95%+ support)
Style parents based on child state — replaces many JS-driven conditional classes.
```css
.form-group:has(:focus-visible) { outline: 2px solid var(--c-primary); }
label:has(input:checked) { font-weight: bold; }
```

### Native CSS Nesting (96%+ support)
```css
.card {
  padding: 1rem;
  & .title { font-size: 1.25rem; }
  &:hover { box-shadow: 0 4px 12px rgb(0 0 0 / 0.1); }
  @media (min-width: 768px) { padding: 2rem; }
}
```
- `&` is mandatory (unlike Sass bare nesting)
- No suffix concatenation (`&-modifier` doesn't work)
- Limit to 2–3 levels

### `color-mix()` (92%+ support)
Runtime color manipulation without preprocessors.
```css
.button:hover { background: color-mix(in oklch, var(--c-primary) 80%, white); }
```

### Cascade Layers (all modern browsers)
See section 2 above.

### Subgrid (97%+ support)
Align children across sibling grid items (e.g., card grids with aligned titles/footers).

---

## 9. Tailwind-Specific Best Practices

### @apply vs Inline
- **Prefer inline classes** in TSX — keeps context colocated, no file switching, no naming
- **@apply only for**: tiny, highly-reused patterns like input resets, AND only when component extraction feels too heavy
- **In React**: extract a component (`<Button>`) over creating a `.btn` @apply class

### Class Organization in TSX
Group logically: layout → sizing → spacing → typography → colors → effects
```tsx
className="vc-flex vc-items-center vc-gap-2 vc-px-4 vc-py-2 vc-text-sm vc-text-white vc-bg-blue-600 vc-rounded hover:vc-bg-blue-700"
```

### Prefix Consistency
- Every Tailwind class must have `vc-` prefix — no exceptions
- Variants go before prefix: `sm:vc-flex`, `dark:vc-bg-gray-900`, `group-hover:vc-opacity-100`
- Use complete class strings in markup for PurgeCSS to detect them — never construct class names dynamically with string interpolation

---

## 10. Review Checklist

When reviewing CSS changes, check for:

1. **Specificity conflicts** — are new selectors at the same specificity level as existing ones?
2. **Unused styles** — did the change orphan any CSS rules?
3. **Token usage** — are raw color/spacing values used instead of tokens?
4. **Prefix compliance** — are all Tailwind classes using `vc-`?
5. **Performance** — are `width`/`height`/`margin` being animated?
6. **Accessibility** — do interactive elements have focus styles? Touch targets >= 44px?
7. **Reduced motion** — do new animations respect `prefers-reduced-motion`?
8. **Cascade safety** — could the new rule unintentionally affect other components?
9. **AI friendliness** — are styles colocated? Are selectors flat and unambiguous?
10. **Consistency** — does the pattern match existing conventions in the codebase?
