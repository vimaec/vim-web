# VIM Flex parity

What VIM Flex's Explore workflow does that vim-web does not, gathered by reading
`vim-renderer/run/cef-builtin` against our `dom-viewers/`. Nothing here invents a feature: an item
that needs the query layer or core work is called out as blocked rather than planned.

**Where things stand.** Rounds 1–4 are done and summarised at the bottom. The open work is below,
from a read of every control on Flex's Explore page, each classified as plain UI over data already
in memory or query-layer (it issues SQL over the model through DuckDB).

Explore builds its page with every chrome part on at defaults: no `columns`, no
`resizableColumns`, no `chrome` overrides, `display` on.

---

## Open — feasible now

These are plain UI in Flex too, so none of them needs a database.

### R1. The ROWS stepper

Two `sm` icon buttons at the right of the VIEW row, no text label — `Collapse one level` and
`Expand one level` — disabled at depth 0 and at the last grouping level, reset to 0 on every
rebuild. Flex's own is plain UI at the group levels (`expandToLevel`); only its last step is a
query, because that one materializes leaves. Ours are already materialized, so the whole thing is
plain UI here. The best-value item on the list: a four-level nesting is unusable without it.

### R2. A total readout under the tree

Flex's footer reads `Total elements` and the count, right-aligned. (In Hierarchy view it reads
`<n> top-level · <n> embedded · <n> total`, which needs the hierarchy — see R10.) Ours has no
footer at all, and the root node already carries the count the Elements column rolls up.

### R3. What the search says

Three wordings, all plain UI:

- The box's placeholder is `Search name, type, id…`; ours says `Search elements…`.
- While a filter narrows the list, Flex shows `N of M match` beside the FILTER BY pill. Ours says
  nothing — a search that hides 3,000 rows reads the same as one that hides none.
- An empty tree takes one of four exact strings: `No elements match this filter and search`,
  `No elements match “<search>”`, `No elements match this filter`, `This model has no elements to
  show`. Ours has one, `No results for "<search>"`, and a separate `Bim data not available . . .`.

### R4. The rest of the tree's keyboard

Flex binds `Home` / `End` to the first and last row, and `Enter` / `Space` to activate a row — the
same path as a body click, Ctrl additive, deliberately *not* expansion. We bind the four arrows and
nothing else.

### R5. Export

An `Export… (elements as CSV, or Revit ids)` icon on the VIEW row opens a 440px dialog: a
`Selection only` / `All shown` scope (locked to All when nothing is selected), a live `→ N
elements` line, an `ELEMENTS CSV` section with `Download…` and `Copy`, and a `REVIT IDS` section
with one card per BIM document, each with its id count and a `Copy` that flips to `Copied ✓`.

Flex's is query-layer because its rows live in DuckDB; every column it exports — ElementId, Domain,
VIM, BIM Document, Workset, Level, Room, Category, Family, Type — is one we already hold on
`AugmentedElement`, so ours would be a walk of the tree in memory. The one new thing is handing the
file to the browser.

### R6. Presets

A button in the panel head carrying the active preset's name, a dot for unsaved drift, and a menu:
the built-in `Default`, each saved preset (sub-line = the grouping joined by `›`), then
`Save changes`, `Save as new…`, `Rename…`, `Delete…`, `Clear preset`. Flex snapshots
`{tree, customSql, grouping, view, display}`. Ours would snapshot what we have: the grouping, the
sort and the tier-tag switch.

### R7. Colour the model by a grouping level

Every GROUP BY pill in Flex is a button: pressing it colours the 3D by that column
(`Color every element by <col>`), and pressing the lit one stops. Flex reaches it through its
display-rule engine, which is query-layer — but the gesture does not have to be. We hold every
element's value at every grouping level and `Element3D.color` takes a colour, so a palette over the
distinct values at one level is plain UI here. The pill's `ds-active` state and tip already exist in
our strip's markup.

### R8. The collapse gutter

A 12px strip down the left of the chrome that folds the whole bar into one line:
`Filter: <summary> · Group by Category › Family / Type · Display: 2 rules`. Worth having only if
our chrome grows past the grouping strip and the search box; noted so the next round does not
reinvent it.

**Suggested order.** R1 and R2 first — small, and the stepper is what a deep nesting needs. Then
R3 and R4, which are wording and bindings. Then R7, the first that touches the 3D. R5 and R6 are
each a day's work and independent of the rest.

---

## Open — blocked

### On a database we do not have

None of these can be honest without a query layer over the model, and none is worth faking:

- **R9. The FILTER BY row and its editor.** A boolean tree of sets (`ALL` / `ANY` / `NONE` /
  `NOT ALL`), rules over seven facets plus parameters, per-rule counts and 3D previews, a value
  picker with `Value` / `Raw value` / `Count`, eight operators, custom SQL with a probe, undo
  toasts. Every choice list and every count is a query.
- **R10. The VIEW segment** (`All elements` / `Hierarchy`) and the `⊕N` host drill-in. The segment
  is disabled until a probe says the model carries hierarchy, and expanding a host leaf queries its
  children.
- **R11. The DISPLAY row and its rule editor.** Show / ghost / hide / colour rules over value sets,
  gradients with statistics, an `Everything else` terminal rule. The rule *effects* are within our
  reach — visibility and colour are ours — the *rule language* is not.
- **R12. The checked-rules vocabulary.** Flex's tree checkboxes are filter rules with five ratified
  states (`include`, `includeInherit`, `includePartial`, `exclude`, `excludeInherit`) and an
  `−n exceptions` badge; every gesture materializes through SQL. Ours mean visibility, which is a
  different statement — see T6 below.
- **R13. The zero-match banner.** `0 elements match — since <step>` with an `Edit rule` button that
  opens the editor on the culprit rule. It needs R9.

### On the design system

- **S5. Reset to default, per settings row.** `DS.createSetting` renders one when given `onReset`,
  which would align us by construction — but its icon is `eraser`, one of the design-system names
  backed only by a Segoe MDL2 codepoint rather than an SVG path, so it is tofu on any non-Windows
  browser. Either the design system gains paths for the `ICON_GLYPHS` names, or we pass our own
  icon. Worth raising upstream: it affects every glyph-named design-system icon we might use.
- **Row centring.** Inside a tree row the label, the count and the level pill all sit about 1.5px
  above centre, because the line box is centred rather than the ink and most of these strings carry
  no descenders. They agree with each other, so a row reads as aligned, and the fix belongs in
  `ds.css` beside S5 rather than in our overrides.

### Ours, not Flex's

- **The Ultra viewer has no Parameters view.** It registers Settings only, since `bimInfoPanel` is
  typed to the WebGL `IElement3D`.
- **The 1.9MB `dist/style.css`.** The font payload decision from round 1, recorded in DS_PORT.md.

---

## Decided, not to be copied

**Ours stays** in three places where Flex differs on purpose:

- **T6. Checkbox vocabulary.** Flex's tree checkboxes mean filter include and exclude and render
  green; ours mean visibility and render cyan. Copying Flex's colours would say "included in a
  filter" about a visibility toggle.
- **S3. Section headers.** Flex heads each settings section with a hairline row; ours uses
  collapsible design-system bands. One column in a 340px panel already runs past a screen, so
  collapsing is worth more than flatness. Revisit if the list ever gets section actions to place.
- **S4. Number rows.** Measured, not assumed: our `.ds-number` is 85px with the range 4px to its
  right, which is Flex's 84px arrangement. The only difference is what the text says — a unit
  there, a range here — and our entries carry no unit.

**Flex's README describes three things its code no longer does**, so do not build from the prose: a
`.ds-dot` colour swatch on group rows (the view supports `rowSwatch`, `vf-element-tree` never
passes it), `shuffle` and `palette` buttons on the GROUP BY row (only the `≡` is built; re-rolling
colours lives in the display rule pane), and resizable columns (the capability exists, Explore does
not enable it).

Flex's Explore also has **no column picker**, **no row context menu** and **no selection-count
readout** in the tree chrome. Our context menu on a tree row is ours, not a parity item.

---

# Done

## Round 1 — the layout

The top bar, the right-hand view panel with Parameters and Settings, a tree-only side panel, the
regrouped control bar, and the icon set redrawn from Fluent UI System Icons (MIT) because Segoe
MDL2 is an OS font whose licence covers neither non-Microsoft platforms nor redistribution.

## Round 2 — the tree and the settings list

| | | |
|---|---|---|
| T1 | Selecting no longer expands; the tree stays as the user arranged it | `6358b8e6` |
| T2 | Level tags (`CAT`, `FAM`, `TYPE`…) on group rows | `3acf93fe` |
| T3 | Header strip with a tri-state check-all; the check column moved to the row's left edge | `8bf74fff` |
| T4 | Sticky ancestor trail | `02090d33` |
| T5 | `Elements` count column and the design system's depth tint | `433ff2d6` |
| T5 | Sortable headers — a reorder of arrays already in memory, under 80ms on 4,473 elements | `c9d51301` |
| S1 | Zebra striping dropped from the settings rows | `6358b8e6` |
| S2 | Label above the control, not beside it | `6358b8e6` |

## Round 3 — the parameters pane and the click vocabulary

| | | |
|---|---|---|
| P1 | Multi-selection summary: shared values, `(varies)` where they differ, a note saying so | `c4ff7ad9` |
| P2 | Flex's dressing — identity block, accented group headings with counts, dense rows — and its 8/12px body inset, 4% group rules, no rule on the instance/type caption | `c4ff7ad9`, `ce8a3bb7` |
| P3 | Raw values: the core stopped discarding the `raw\|display` pair, and the toggle adds a column rather than swapping the value | `396663f9`, `c70a070b` |
| P4 | `‹ Summary ›` pager, reaching 200 elements and saying how many it leaves out | `631ec8dc` |
| P5 | The eye collapses the selection to the shown element; a strip puts it back | `9b83002e` |
| T7 | Double-clicking a group opens it as well as framing it | `1303403e` |
| T8 | A plain click on the sole selection releases it | `1303403e` |
| T9 | Ctrl with shift adds the range instead of replacing it | `1303403e` |
| T10 | The keyboard ring no longer lights on a mouse click | `1303403e` |
| — | A viewport pick reveals the first marked row in tree order, as Flex does | `1303403e` |

## Round 4 — the grouping drawer

| | | |
|---|---|---|
| G1 | An ordered, editable nesting over the six columns we can read, through a `GROUP BY` strip and its drawer: move, remove, add by family with "not in model" struck through, tier tags, reset | `e5572d04` |
| G1 | Reorder by dragging the row — Flex's *filter* drawer vocabulary, no grip — plus a burger toggle at the pills' height and Flex's own row metrics | `f92fee66` |
| — | Four alignment defects: the panel's stray scrollbar and inset, pill text centred on measured ink, the sort arrow's clearance | `b6085146` |
| — | An open drawer yields and scrolls rather than pushing the tree off a short panel | `ef7e32d0` |

**Two divergences, both about a 340px panel.** Flex reorders by a grip; we drag the whole row, as
its filter drawer does. And Flex ends its strip with a `· Element` leaf indicator, which costs more
width than it says when the pills are the information and the drawer's terminal row states it
anyway — dropping it is what lets the default three levels read in full on one line.

## Closed inspections

- **Ctrl and shift beyond the range anchor.** Flex's `activateInterval` takes an `additive` flag —
  adopted as T9.
- **Whether Flex reveals the focused row on an engine pick.** It marks and scrolls to the first
  marked row, only when the selection did not come from the tree, and never expands.
