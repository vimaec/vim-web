# VIM Flex parity — round 2

What VIM Flex's Explore workflow does that vim-web does not yet, gathered by reading
`vim-renderer/run/cef-builtin` (the shell, `vf-element-tree`, `vf-tree-view`, `vf-data-tree`,
`shell-views/settings.js`) against our `dom-viewers/`. Round 1 delivered the layout: the top bar,
the right-hand view panel with Parameters and Settings, a tree-only side panel, the regrouped
control bar and the Fluent icon set.

Every item below names what Flex does, what we do today, and what to change. Items marked ★ were
called out directly. Nothing here invents a feature: anything needing the query layer or core work
is called out as blocked rather than planned.

**Status after round 2:** T1–T5 and S1–S2 are done; each carries the commit that closed it. S3 and
S4 are settled without a change, for the reasons recorded under them. S5 stays blocked upstream.
T7 and T8 are new findings, for round 3.

## Tree

### ★ T1. Do not expand on selection — done (`6358b8e6`)

**Flex** never expands on a pick. The tree marks the row and emits `focuschanged`; `expandToNode`
exists but is only called when something explicitly asks to reveal a node.

**Ours** expands every ancestor of every selected element, then rebuilds and scrolls
(`bim/bimTree.ts`, `syncSelection`). Selecting in the viewport therefore rearranges the tree under
the user, which is what makes it feel wrong.

**Change.** Drop the `applySubStateUpdate('expandedItems', …)` and the rebuild it forces. Keep the
highlight, and reveal only when the row is already visible. Small and self-contained.

### ★ T2. Level tags on group rows — done (`3acf93fe`)

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

### ★ T3. Select-all checkbox above the checkbox column — done (`8bf74fff`)

**Flex** has a header strip over the tree whose column can carry a checkbox, with tri-state paint
and this rule: *a mixed or empty header checks everything, a fully-checked one clears*.

**Ours** has no header row at all.

**Change.** Add a `.ds-cols` strip above the virtual tree holding a `.ds-tree__check` cell. The
design system already accounts for exactly this (`.ds-cols:has(> .ds-tree__check)` and the 38px
label offset beside it), so the styling is free. Wire it to `isolation.showAll()` and `hideAll()`,
painting from the root node's own visibility so it reads `on`, `partial` or `off` like the rows.

### T4. Sticky ancestor trail — done (`02090d33`)

**Flex** pins the open-group chain of the first visible row to the top of the scroll box, so context
survives mid-scroll. The design system ships the scaffold (`.ds-tree__trail`, sticky, opaque, its
rows ordinary tree items).

**Ours** does not use it. Worth doing: it costs one container and a per-render ancestor walk, and
deep trees are exactly where our tree is hardest to read.

**Done.** The trail reads the first row actually on screen, not the overscanned window start, and
walks up the flat item list by decreasing level. A pinned row repeats the full row vocabulary over
the same columns — an empty check cell, the tag, the label, the count — so it stands exactly over
the rows below it; Flex omits the check cell and lets its trail sit left of its rows.

### T5. Count column — done (`433ff2d6`); sortable header deferred

**Flex** renders a Count column by default and sorts from the header.

**Ours** has neither. The data is there (`BimTreeData.getLeafs`), so a count is cheap once T3 brings
in a header strip. Sorting is a larger change to the tree data and can wait.

**Done** for the column, labelled `Elements` as Flex labels it, with the count rolled up once at
build time rather than walked per render. A leaf's cell stays empty, which is what Flex's count
column does with a leaf too. Rows also took the design system's depth tint (`ds-depth-0..3`) in the
same pass, since that is what makes a level legible in Flex without reading the pill.

Sorting still waits: it wants an ordering in the tree data, not a column.

### T6. Checkbox vocabulary (note, not a change)

Flex's tree checkboxes mean filter include and exclude, and render green through
`ds-chk--include` / `--includePartial` / `--exclude`. Ours mean visibility and render cyan through
`ds-on` / `ds-partial`. Both exist in the design system. Keep ours: the colours carry different
meanings and copying Flex's would say "included in a filter" about a visibility toggle.

## Settings panel

### ★ S1. Drop the zebra striping — done (`6358b8e6`)

Flex's settings rows are unstriped. Ours stripe every other row
(`.vim-ds-entry:nth-child(odd) { background: var(--stage-800) }`). Remove it there; the tree rows
keep theirs.

### ★ S2. Label above the control, not beside it — done (`6358b8e6`)

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

### S3. Section headers — settled, no change

Flex heads each section with a row carrying a bottom hairline (`.sv-set__sech`) and puts section
actions on its right. Ours uses collapsible design-system bands. Theirs is flatter; ours collapses.

**Keeping ours.** Our settings list is one column in a 340px panel and already runs past a screen,
so collapsing is worth more than flatness — and a band is the design system's own heading, which a
hand-rolled hairline row would duplicate. Revisit if the list ever gets section actions to place.

### S4. Number rows — settled, already equivalent

Flex gives the stepper a fixed 84px input and puts the unit beside it. The claim that ours is
different was wrong: measured live, our `.ds-number` is 85px (a 64px field plus the 18px stepper
stack) with the range 4px to its right, which is Flex's arrangement at Flex's width. The only
difference is what the text says — a unit there, a range here — and our entries carry no unit to
show. Nothing to change.

### S5. Reset to default — blocked

Flex gets a reset affordance per row free, because `DS.createSetting` renders one when given
`onReset`. Adopting that row would align us by construction.

**Blocked:** its icon is `eraser`, which is one of the design-system names backed only by a Segoe
MDL2 codepoint, not an SVG path. On any non-Windows browser it renders as tofu. Either the design
system gains SVG paths for the `ICON_GLYPHS` names, or we pass our own icon. Worth raising upstream,
since it affects every glyph-named design-system icon we might use.

## For round 3

### T7. Double-click a group expands it

**Flex** activates the row and expands it (`onDblClick`, group rows only); its framing lives on the
control bar, not on the tree.

**Ours** frames the selection on a double-click, anywhere in the tree — behaviour inherited from
the React viewer and part of the public feel, so this is a decision, not a defect. Expanding *and*
framing a group is a third option and probably the useful one: the double-click already selects the
whole group, so framing it and opening it answer the same gesture.

### T8. Clicking the sole selected row releases it

**Flex** treats a plain click on the row that is already the only selection as a release: the
selection clears and the focus ring goes with it. It is the only in-tree gesture that drops a
selection, since a 3D click never reaches its DOM.

**Ours** re-selects the same row. Small and self-contained: the guard is that the click carries no
modifier, is not the second half of a double-click, and the row is the whole selection.

## Still to inspect

- What Flex does on ctrl and shift beyond the range anchor (`activateInterval` takes both).
- Whether Flex's tree reveals the focused row on an engine pick, and how.
- The grouping drawer, for where a level-tag toggle and multi-column grouping would live.

## Order

Round 2 ran T1, S1, S2, then T2, then T3 with T5's count on top of it, then T4 — each built,
verified live and committed on its own.

Round 3 starts with **T8** (self-contained), then **T7** once its framing question is answered, then
the header sort under **T5**. **S5** waits on the design system.
