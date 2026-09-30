# VIM Flex parity — round 2

What VIM Flex's Explore workflow does that vim-web does not yet, gathered by reading
`vim-renderer/run/cef-builtin` (the shell, `vf-element-tree`, `vf-tree-view`, `vf-data-tree`,
`shell-views/settings.js`) against our `dom-viewers/`. Round 1 delivered the layout: the top bar,
the right-hand view panel with Parameters and Settings, a tree-only side panel, the regrouped
control bar and the Fluent icon set.

Every item below names what Flex does, what we do today, and what to change. Items marked ★ were
called out directly. Nothing here invents a feature: anything needing the query layer or core work
is called out as blocked rather than planned.

**Status after round 4:** T1–T10, S1–S2, P1–P5 and G1 are done; each carries the commit that
closed it. S3 and S4 are settled without a change, for the reasons recorded under them. S5 stays
blocked upstream, and is the only item left open.

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

### T5. Count column and sortable header — done (`433ff2d6`, `c9d51301`)

**Flex** renders a Count column by default and sorts from the header.

**Ours** has neither. The data is there (`BimTreeData.getLeafs`), so a count is cheap once T3 brings
in a header strip. Sorting is a larger change to the tree data and can wait.

**Done** for the column, labelled `Elements` as Flex labels it, with the count rolled up once at
build time rather than walked per render. A leaf's cell stays empty, which is what Flex's count
column does with a leaf too. Rows also took the design system's depth tint (`ds-depth-0..3`) in the
same pass, since that is what makes a level legible in Flex without reading the pill.

Sorting landed too, and cheaply: `BimTreeData.sort` reorders the child arrays already in memory
and renumbers the flat order a shift-range slices — nothing is re-queried and no node is rebuilt,
so ids stay valid and both the expansion and the selection survive a sort. A whole click measures
under 80ms on a 4,473-element model, most of it the headless-tree rebuild. Name sorting collates
numerically, so Countertop2 precedes Countertop10.

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

## Parameters pane — done

### P1. Multi-selection summary (`c4ff7ad9`)

Flex's summary page: the identity fields read their shared value or `(varies)`, the body keeps only
the parameters every selected element carries, and one they all carry but value differently reads
`(varies)` too, under a note saying so. Parameters come from the vim's own cache, so this is a
lookup per element rather than a query per element — 1,700 elements summarize in 173ms.

### P2. Flex's dressing (`c4ff7ad9`, `ce8a3bb7`)

Mono uppercase identity keys over a hairline; group headings that are a caret, an accented title
and a count rather than design-system bands; dense rows; values that wrap rather than truncate;
blanks dashed; collapse-all / expand-all with the groups they act on. The bands stay in the
settings list, where a short list of controls wants the weight.

Three numbers were off and are fixed: the body was not inset (Flex insets 8px / 12px), the group
rules used the design system's soft hairline rather than Flex's 4% tint, and the instance / type
caption carried a rule of its own that made a caption look like a group.

### P3. Raw values (`396663f9`, `c70a070b`)

A parameter is stored as a `raw|display` pair and both our core and vim-format's helper discarded
the raw half, so there was nothing for a toggle to show. `getBimParameters()` now answers
`BimParameter`, with `rawValue` beside `value`, and the toggle adds a third column rather than
swapping the value — a stored value is only interesting beside what it displays as. Splitting the
pair properly also fixed blank rows: a pair with an empty display half falls back to its raw value,
as Flex's does.

### P4. Pager (`631ec8dc`)

`‹ Summary ›` above the panel, reaching 200 elements where Flex draws the same line; the summary
still speaks for the whole selection and the dropdown says how many it does not page through. A new
selection starts over at the summary.

### P5. The eye (`9b83002e`)

Collapses the selection to the element on show, with a strip that puts it back and lands on the page
the eye was pressed on; the offer retires when any other selection arrives. Flex tags its own
selection writes with a nonce and recognizes the echo by it; our selection observable carries no
cause, so the write is remembered and its echo recognized by contents.

**Not adopted:** the per-row filter funnel (it wants tree rules) and compare mode (it wants a second
model). Both are query-layer features.

## Done in round 4

### G1. The grouping drawer — done (`e5572d04`)

**Flex** opens a drawer off the GROUP BY strip: reorder the levels (drag, Up, Down), remove one
(×), add one by family with per-model availability (IDENTITY: Category, Family, Type, Family Type;
MODEL: Workset, Model, BIM Document; SPATIAL: Level, Room), toggle the tier tags, and reset to the
workflow's default nesting.

**Ours** is a `Group by` select over three fixed presets, each a fixed three-level nesting.

**Done, without the query layer.** `toTreeData` builds the nesting from `AugmentedElement` fields,
so the ordered list is a UI change: the strip is numbered pills, the drawer is a row per level with
its family tag and move-up / move-down / remove, the fixed Element terminal row, ADD GROUP chips by
family, the tier-tag toggle (the switch T2 was missing) and a reset. The columns are the six we can
read; Room and Domain stay out, since a column we cannot read is worse than one we do not offer.

Flex probes its database for which columns a model has values for; we scan the elements already in
hand for the same answer, so a column the model says nothing about is offered struck through rather
than silently producing one `(none)` band.

A stored nesting is guarded per column, so a preset string from an older build falls back to the
default instead of breaking the tree.

Dragging landed in a follow-up (`f92fee66`), in the vocabulary of Flex's *filter* drawer rather
than its grouping drawer: the whole row is the handle, so there is no grip gutter, and the drag
wears that drawer's cyan drop rule with a dot at its head, its pointer-borne card, its faded source
row and its 4px threshold. The strip's toggle is a burger at the pills' height, as Flex's is, and
the drawer's row metrics now come from Flex's stylesheet rather than my eye.

**One divergence, about a 340px panel.** Flex ends its strip with a `· Element` leaf indicator,
which costs more width than it says when the pills are the information and the drawer's terminal row
states it anyway — dropping it is what lets the default three levels read in full on one line.

## Closed inspections

### Ctrl and shift beyond the range anchor — answered, done (`1303403e`)

Flex's `activateInterval` takes an `additive` flag: ctrl with shift adds the interval to the
selection instead of replacing it. Ours does now too.

### Whether Flex reveals the focused row on an engine pick — answered, done (`1303403e`)

It does: `applyExternalSelection` marks and then scrolls to the first marked row, but only when the
selection did not come from the tree itself, and it never expands. Ours revealed the last element
picked; it now reveals the first marked row in tree order, since a rectangle hands over its
elements in no particular order.

### T10. The keyboard ring belongs to the keyboard — done (`1303403e`)

Flex re-seats the roving index on a click but deliberately leaves its ring off, so a mouse gesture
leaves two visible states. Ours painted the selection fill and the focus ring at once.

## Done in round 3

### T7. Double-click a group expands it — done (`1303403e`)

**Flex** activates the row and expands it (`onDblClick`, group rows only); its framing lives on the
control bar, not on the tree.

**Ours** framed the selection on a double-click, anywhere in the tree — behaviour inherited from
the React viewer and part of the public feel. Both now happen: a double-click on a group frames it
*and* opens it, since the gesture had already selected the whole group.

### T8. Clicking the sole selected row releases it — done (`1303403e`)

**Flex** treats a plain click on the row that is already the only selection as a release: the
selection clears and the focus ring goes with it. It is the only in-tree gesture that drops a
selection, since a 3D click never reaches its DOM.

**Ours** re-selected the same row. It now releases, guarded so that the click carries no modifier,
is not the second half of a double-click, and the row is the whole selection.

## Order

Round 2 ran T1, S1, S2, then T2, then T3 with T5's count on top of it, then T4. Round 3 ran the
header sort, the parameters pane (P1–P5) and the click vocabulary (T7, T8, T9, T10). Round 4 ran
G1, the grouping drawer. Each was built, verified live and committed on its own.

**S5** is all that is left, and it waits on the design system gaining SVG paths for its
glyph-named icons. What remains unmatched beyond that is query-layer work — Flex's tree rules and
filter drawer, the per-row parameter funnel, compare mode, marquee selection — which needs a
database we do not have, not a round of parity.
