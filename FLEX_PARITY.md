# VIM Flex parity — round 2

What VIM Flex's Explore workflow does that vim-web does not yet, gathered by reading
`vim-renderer/run/cef-builtin` (the shell, `vf-element-tree`, `vf-tree-view`, `vf-data-tree`,
`shell-views/settings.js`) against our `dom-viewers/`. Round 1 delivered the layout: the top bar,
the right-hand view panel with Parameters and Settings, a tree-only side panel, the regrouped
control bar and the Fluent icon set.

Every item below names what Flex does, what we do today, and what to change. Items marked ★ were
called out directly. Nothing here invents a feature: anything needing the query layer or core work
is called out as blocked rather than planned.

## Tree

### ★ T1. Do not expand on selection

**Flex** never expands on a pick. The tree marks the row and emits `focuschanged`; `expandToNode`
exists but is only called when something explicitly asks to reveal a node.

**Ours** expands every ancestor of every selected element, then rebuilds and scrolls
(`bim/bimTree.ts`, `syncSelection`). Selecting in the viewport therefore rearranges the tree under
the user, which is what makes it feel wrong.

**Change.** Drop the `applySubStateUpdate('expandedItems', …)` and the rebuild it forces. Keep the
highlight, and reveal only when the row is already visible. Small and self-contained.

### ★ T2. Level tags on group rows

**Flex** puts a small mono pill before each group row's label saying which grouping level it is,
from a fixed table with a fallback to word initials or the first four letters:

| Column | Tag | | Column | Tag |
|---|---|---|---|---|
| Category | `CAT` | | Workset | `WSET` |
| Family | `FAM` | | Level | `LVL` |
| Type | `TYPE` | | Room | `ROOM` |
| BIM Document | `DOC` | | Domain | `DOM` |
| VIM | `VIM` | | *other* | initials, else first 4 |

It is session state, default on, toggled from the grouping drawer.

**Ours** has no tag.

**Change.** Emit `<span class="ds-tree__lvl">` before the label on group rows. The design system
already styles it, so this is markup plus a depth-to-tag lookup. Our three groupings give `CAT`,
`LVL` or `WSET` at depth 0 and `FAM` then `TYPE` below. Skip the on/off toggle until there is a
grouping drawer to host it.

### ★ T3. Select-all checkbox above the checkbox column

**Flex** has a header strip over the tree whose column can carry a checkbox, with tri-state paint
and this rule: *a mixed or empty header checks everything, a fully-checked one clears*.

**Ours** has no header row at all.

**Change.** Add a `.ds-cols` strip above the virtual tree holding a `.ds-tree__check` cell. The
design system already accounts for exactly this (`.ds-cols:has(> .ds-tree__check)` and the 38px
label offset beside it), so the styling is free. Wire it to `isolation.showAll()` and `hideAll()`,
painting from the root node's own visibility so it reads `on`, `partial` or `off` like the rows.

### T4. Sticky ancestor trail

**Flex** pins the open-group chain of the first visible row to the top of the scroll box, so context
survives mid-scroll. The design system ships the scaffold (`.ds-tree__trail`, sticky, opaque, its
rows ordinary tree items).

**Ours** does not use it. Worth doing: it costs one container and a per-render ancestor walk, and
deep trees are exactly where our tree is hardest to read.

### T5. Count column and sortable header

**Flex** renders a Count column by default and sorts from the header.

**Ours** has neither. The data is there (`BimTreeData.getLeafs`), so a count is cheap once T3 brings
in a header strip. Sorting is a larger change to the tree data and can wait.

### T6. Checkbox vocabulary (note, not a change)

Flex's tree checkboxes mean filter include and exclude, and render green through
`ds-chk--include` / `--includePartial` / `--exclude`. Ours mean visibility and render cyan through
`ds-on` / `ds-partial`. Both exist in the design system. Keep ours: the colours carry different
meanings and copying Flex's would say "included in a filter" about a visibility toggle.

## Settings panel

### ★ S1. Drop the zebra striping

Flex's settings rows are unstriped. Ours stripe every other row
(`.vim-ds-entry:nth-child(odd) { background: var(--stage-800) }`). Remove it there; the tree rows
keep theirs.

### ★ S2. Label above the control, not beside it

**Flex** gives the row two columns and then spans the label across both, so the label sits on its
own line with the control full width beneath it:

```css
.sv-set .ds-setting { grid-template-columns: 1fr min-content; gap: 2px 6px; padding: 5px 0; }
.sv-set .ds-setting__label { grid-column: 1 / -1; }
.sv-set .ds-select { width: 100%; }
```

**Ours** is a 50/50 split with the label and control side by side, which is why ours reads cramped
in a narrow panel and theirs does not.

**Change.** Match their arrangement in the settings view only. Generic panels elsewhere can keep the
side-by-side row.

### S3. Section headers

Flex heads each section with a row carrying a bottom hairline (`.sv-set__sech`) and puts section
actions on its right. Ours uses collapsible design-system bands. Theirs is flatter and scans better
for a long list; ours collapses, which a long list also wants. Decide before changing.

### S4. Number rows

Flex gives the stepper a fixed 84px input and puts the unit beside it. Ours appends the range as
grey text after the control. Theirs is tidier in a narrow column.

### S5. Reset to default — blocked

Flex gets a reset affordance per row free, because `DS.createSetting` renders one when given
`onReset`. Adopting that row would align us by construction.

**Blocked:** its icon is `eraser`, which is one of the design-system names backed only by a Segoe
MDL2 codepoint, not an SVG path. On any non-Windows browser it renders as tofu. Either the design
system gains SVG paths for the `ICON_GLYPHS` names, or we pass our own icon. Worth raising upstream,
since it affects every glyph-named design-system icon we might use.

## Still to inspect

- Row click and double-click semantics, and what Flex does on ctrl and shift.
- Whether Flex's tree reveals the focused row on an engine pick, and how.
- The grouping drawer, for where a level-tag toggle and multi-column grouping would live.

## Suggested order

1. **T1**, then **S1** and **S2**. Small, visible, no new structure.
2. **T2**. Markup over an existing design-system class.
3. **T3**, which brings in the header strip, then **T5**'s count on top of it.
4. **T4**.
5. **S3** and **S4** once you have picked a direction; **S5** after the design system answers.
