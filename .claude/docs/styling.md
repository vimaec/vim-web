# Styling Guide

Reference for working with `style.css` in the react-viewers layer. Covers the token system, layout patterns, third-party override conventions, and known pitfalls.

---

## Token System

All design values live in `:root` at the top of `style.css`. Never use raw values in component rules.

### Colors
```css
/* Brand */
--c-primary, --c-primary-royal, --c-secondary-yellow

/* Grays (darkest → lightest) */
--c-darkest-gray, --c-darker-gray, --c-dark-gray-warm, --c-dark-gray-cool,
--c-medium-gray, --c-gray-divider, --c-light-gray, --c-lightest-gray, --c-white

/* Accents */
--c-lightest-blue    /* selection highlight background */
--c-list-hover       /* warm yellow for hovered list rows */
--c-overflow         /* dark overlay for blocking UI */
--c-focus-ring       /* subtle blue for focus-ring-style effects */
```

### Spacing / Gap
Only two gap values are used:
```css
--gap-xs: 0.25rem;   /* 4px  — inline/icon gaps */
--gap-sm: 0.625rem;  /* 10px — standard item gaps */
```
Use `gap: 0` (bare zero, no unit) for explicit zero gaps.

### Z-index Scale
```css
--z-overlay: 10;  /* loading overlay */
--z-ui:      20;  /* control bar, axes panel, side panel */
--z-panel:   30;  /* panel overlay container, side panel nav */
--z-modal:   40;  /* modal dialogs */
--z-popup:   50;  /* dropdowns, context menus */
```

### Typography
```css
--font-size-xs / sm / base / lg / xl
--font-weight-medium: 500
--font-weight-semibold: 600
```

### Other
```css
--radius-sm: 4px  |  --radius-md: 6px  |  --radius-full: 9999px
--shadow-sm / md / lg
--transition-fast: 0.15s  |  --transition-base: 0.2s
--size-control: 32px  /* standard button/row height */
```

---

## Panel / Entry Architecture

Three panel instances share the same base class structure (`vim-panel-*`) with instance-specific overrides:

```
.vim-settings-panel   — main settings popup (settings + isolation entries)
.vim-bim-header       — flat readonly entries (name / id / category)
.vim-bim-body         — group → section → zebra entries (BIM parameters)
```

### Class Hierarchy
```
.vim-panel-list          flex column container
  .vim-panel-group       collapsible group (details/summary)
    .vim-panel-section   collapsible section (details/summary)
      .vim-panel-entry   dt/dd row
```

### Entry Layout
Base: `dt` = 50% fixed, `dd` = flex row, centered, `--gap-xs` gap.
Override for BIM panels: `dd` → `display: block` (single text value, no input).

### Zebra Striping
Panel background is `--c-lightest-gray`. Rows alternate:
```css
.vim-panel-entry:nth-child(odd)  { background: var(--c-white); }
.vim-panel-entry:nth-child(even) { background: transparent; }
```
Transparent even rows show the panel background. **If the panel background is white, zebra will be invisible.** Keep `.vim-panel` background at `--c-lightest-gray`.

BIM body uses the same pattern on `.vim-bim-body-entry`. BIM tree uses the same on `li` items.

### Section Title Style
The shared override block (below the base classes) applies two styled variants to both `.vim-settings-panel` and `.vim-bim-body`:
- **Tab-style group title**: `inline-flex`, bordered top, rounded top corners
- **Filled section title**: solid `--c-light-gray` background, small-caps label

---

## `vim-hidden` Pattern

The `vim-hidden` class is used to toggle component visibility from JS:
```ts
el.classList.toggle('vim-hidden', !shouldShow)
```

**Each component that uses this pattern needs its own CSS rule.** There is no global `.vim-hidden { display: none }` — because `vim-hidden` is also used as a *state* class on BIM tree visibility icons (where it means "this element is currently hidden" — not that the icon itself should be hidden).

```css
/* Correct pattern — component-scoped */
.vim-axes-panel.vim-hidden       { display: none; }
.vim-performance-div.vim-hidden  { display: none; }
```

If you add a new toggleable component, add a matching scoped rule. If the toggle doesn't work, this is the first thing to check.

---

## Third-Party Library Overrides (`!important`)

Three blocks use `!important` to override library styles. All are documented with comments explaining why:

| Selector | Library | Why |
|---|---|---|
| `.__react_component_tooltip::after/before` | react-tooltip | Removes shadow arrow cutting into tooltip text |
| `.vim-tooltip` | react-tooltip | Overrides library's own inline/default styles |
| `.vim-bim-tree .rct-tree-item-button` | react-complex-tree | Overrides library's inline `display` and justify |
| `.vim-performance` | stats-js / react-tooltip | Overrides inline positioning |

**Rule**: Only use `!important` for third-party overrides. Always add a comment explaining which library and why.

---

## Tree Visibility State Machine

The BIM tree visibility toggle icon has two CSS classes (`vim-visible` / `vim-hidden`) and three context-dependent hover states. The CSS for this is in the "Tree View Visibility Toggles" section. Key points:

- Default `vim-visible` → `display: none` (hidden until hover)
- Default `vim-hidden` → always visible with a "hidden" icon
- Hover color changes based on selection state: beige → light-blue → royal-blue

SVG icons for the visibility eye are stored as CSS custom properties (the `--visible-*` and `--hidden-*` variables at the top of `:root`). They're long but correctly placed there.

---

## Responsive Scaling

The viewer uses **container queries** (not media queries) throughout. Container types are set on wrapper divs:

```css
.vim-side-panel    { container-type: size; }
.vim-modal         { container-type: size; }
.vim-loading-container { container-type: size; }
```

The responsive block at the bottom (`@container (width > 0)`) uses `min()` with `cqmin`/`cqh` units to scale gaps and font sizes fluidly:
```css
gap: min(2cqmin, 4px);
font-size: min(5cqmin, 1rem);
```

---

## Focus / Accessibility

Focus rings are **intentionally suppressed**. This viewer is pointer/touch-driven. Hover feedback is implemented manually on all interactive elements. Keyboard navigation is not a supported interaction mode.

```css
/* Intentional — do not add :focus-visible styles */
.vim-component button:focus { outline: 0; box-shadow: none; }
```

---

## Generic Number Entry — Range Display

`GenericNumberEntry` auto-derives a range hint from `min`/`max` when `info` is not explicitly set:

| Fields | Displayed |
|---|---|
| `min` + `max` | `[0, 1]` |
| `min` only | `≥ 0` |
| `max` only | `≤ 5` |
| explicit `info` | that string (takes priority) |

When adding number entries, prefer `min`/`max` over a manual `info` string — it also enforces the constraint natively in the HTML input.

---

## Code Style Rules

- **Zero values**: always bare `0`, never `0px`
- **Gap values**: always `var(--gap-xs)` or `var(--gap-sm)`, never raw `4px`/`8px`/`0.25rem`/`0.5rem`
- **Colors**: always `var(--c-*)`, never raw hex or rgb
- **Font weights**: always `var(--font-weight-medium/semibold)` for 500/600
- **Z-index**: always `var(--z-*)`, never raw numbers
- **Magic numbers**: add an inline comment explaining the value (e.g. `/* chevron size */`, `/* 33% label / 67% value split */`)
