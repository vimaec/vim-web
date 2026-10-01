# Roadmap to 1.0.0

What stands between this branch and a stable release, in the order it wants doing. Every item below
was found by reading the repository as it is today; each one names its evidence so the next reader
can check rather than trust.

## Why 1.0.0 and not 2.0.0

The tags stop at `1.0.0-beta.3`, and npm's `latest` points at a beta. No stable 1.x was ever
published, so there is no released line for anyone to migrate *from* — calling this 2.0.0 would
promise a history that does not exist. The React UI was never part of a stable release either; it
goes out as a beta that ended, documented in [MIGRATION.md](MIGRATION.md).

If a customer is already pinned to `1.0.0-beta.x` in production, that changes the calculus and the
number should be revisited — that is the one thing worth checking before the tag.

## Where the branch stands

The UI is rebuilt on [vim-html-ds](https://github.com/vimaec/vim-html-ds) with React removed
([DS_PORT.md](DS_PORT.md)), and five rounds of VIM Flex parity are done and recorded with their
commits in [FLEX_PARITY.md](FLEX_PARITY.md). A review pass over the branch closed a right-click bug
that cleared the selection a context menu was about to act on, a `hidden` attribute that any class
setting `display` was silently overriding, and the host capacities the viewer was not honouring
(`canReadLocalStorage`, `canDownload`, `canFollowUrl`).

What is left is not UI work.

---

## Stage 1 — packaging and release mechanics

Nothing else matters until a release can actually be cut, and until the artefact it cuts is one a
host app can live with.

### 1.1 three.js ships as a peer dependency  ·  **done** (`69e6870c`)

`origin/sroberge/three-peerdep` is merged. three is externalised from the bundle and declared as the
one peer dependency; the ESM output drops from 3.25MB to 1.39MB, and the IIFE build goes with it, so
vim-web ships ESM only. The branch predated the React removal, so only its three half was kept.

### 1.2 The release workflow runs  ·  **done** (`10eab583`)

It called `npm run release-patch` / `release-minor` / `release-major`, none of which exist — every
release run would have failed there — and it checked out without submodules while `prebuild` builds
`vim-html-ds` from one, so it would have failed even earlier. It now checks out submodules, installs
from the lockfile, builds, versions with a `[ci-skip]` message so it cannot trigger itself,
publishes under a dist-tag the operator picks (`latest` is wrong while the package is in beta) and
pushes the version commit and tag back. A `prerelease` type is there for beta bumps.

### 1.3 Pin the design system to a tag  ·  **waiting on the DS**

The submodule sits at `3bc0a66`, which `git describe` reports as `v0.4.0-116-g3bc0a66` — a merge
commit 116 commits past the last tag, carrying package version 1.0.0. Pin a tagged design-system
release when one is cut, so the build is reproducible by anyone who can reach the repository.

---

## Stage 2 — confidence

### 2.1 A test suite, finally  ·  **done**

There was no test directory and no test runner; `tsc` was the only gate. The branch rewrote 233
files and some 11,500 lines of UI, and every behaviour in it was verified by driving a browser by
hand — none of it repeatable by anyone else, which made the next change to the tree a gamble.

Vitest now runs on every branch and pull request and before every publish, over 57 tests in three
files:

- **`BimTreeData`** (27). Pure logic, no DOM: grouping, `sort`, counts, `updateVisibility`,
  `openToDepth`, `getRange`, `orderedLeaves`. Where a regression would be both likely and invisible.
- **The tree's click vocabulary** (19, happy-dom). The gestures the parity rounds settled: plain
  click selects, a second plain click releases, ctrl adds and removes, shift ranges from the last
  plain pick, ctrl with shift adds the range, right-click does not release, double-click frames and
  opens. Plus the depth stepper, the keyboard ring, the hand-off of the viewer's keyboard, and the
  visibility checkboxes rolling up.
- **A smoke test** (11, happy-dom). The public module graph and the chrome around the canvas:
  container, control bar, top bar, view panel, modal, grouping strip, ROWS stepper — each mounted,
  driven and destroyed.

Neither viewer root is in that smoke test, and deliberately: `Dom.Webgl` wants a WebGL 2 context and
Ultra's stream decoder wants `OffscreenCanvas.getContext`, and happy-dom has neither. Faking a GPU
would only test the fake. Constructing both roots is what 2.2's live run covers, and a browser-based
runner (Vitest's browser mode, or Playwright) is the way to have it headless — worth doing, not
worth blocking a stable tag on.

### 2.2 Exercise Ultra against a live server  ·  **ready, needs the server**

Half the product. [DS_PORT.md](DS_PORT.md) records only a run against a missing server, and the
viewer root changed underneath it during the port. VIM Flex's Ultra server is the one to point at.
Walk the surface: connect, load, selection, visibility, section box, the settings view.

---

## Stage 3 — what consumers inherit

### 3.1 The 1.9MB stylesheet  ·  **waiting on the DS's new font solution**

The design system is replacing Segoe; the font payload is best settled in the same pass rather than
worked around here first. The measurements below are what that pass should aim at.

`dist/style.css` is 1,927,745 bytes, of which **1,731,837 (90%) are eight inlined font files**. The
CSS itself — the design system's rules plus all of ours — is 196KB.

The declarations come from `ds.css`, under a comment reading "served from `vimflex://shell/fonts/`":
written for Flex's CEF shell, where the host serves the files. On the web they resolve into the
bundle, and Vite's library mode inlines any asset referenced from CSS regardless of
`assetsInlineLimit` (measured: setting it to 0 changes nothing).

Three fixes, which can be taken in any combination:

| Where | Change | Effect |
|---|---|---|
| vim-web | Post-build step: extract the `data:` URIs to `dist/fonts/`, rewrite the URLs | Same bytes, cacheable and parallel, not render-blocking |
| vim-html-ds | Ship Roboto as subsetted woff2 instead of unsubsetted variable TTF, drop the `.woff` fallbacks | ~965KB of the 1.73MB is the two Roboto TTFs alone |
| vim-html-ds | Split `@font-face` into its own stylesheet | A host with its own brand fonts can skip them |

The design system also carries 3.9MB of Segoe UI and MDL2 TTFs that **no stylesheet references**,
and which — per the licence reading that drove the icon redraw — we have no right to redistribute.
That one is worth raising upstream on its own merits, not as a page-weight question.

### 3.2 Narrow the public surface  ·  **done**

`dom-viewers/index.ts` re-exported every sub-barrel, so `VIM.Dom` carried the widgets the viewer
builds its own chrome from — `bimPanel`, `bimSearch`, `bimGrouping`, `bimRows`, `bimPresets`,
`bimExport`, `controlBar`, `topBar`, `viewPanel`, `modal`, `sidePanel`, `axesPanel`, `logo`,
`speedToast`, `settingsPanel`, the whole `State` namespace of root wiring. Each takes options
written for its one call site, and a stable tag would have frozen every one of those shapes.

The rule applied: export the **contracts** a host customizes through, not the factories that build
our chrome. So the `ControlBar*`, `TopBar*`, `ContextMenu*`, `View*`, `Modal*` and BIM-info types
stay, together with the id maps (`controlBarIds`, `topBarIds`, `contextMenuIds`) that customizations
address buttons by; the factories behind them do not. `MIGRATION.md` lists what each removed name is
reached through now.

Two things went the other way, because a kept export has to be callable:

- `Dom.Bim.bimTree` names `BimTreeData`, `GroupingColumn` and `SortSetting` in its options, and none
  of the three was exported — a consumer could call it but not write down the type of what it is
  handed. The data model is exported now, with `toTreeData` and `DEFAULT_GROUPING`.
- `toTreeData` takes `AugmentedElement[]`, and `getElements(vim)` is the only thing that builds
  them. The type was exported, the function was not; it is now.

One departure from what was sketched. `bimPanel` was on the keep list, and it is gone: its options
take `WebglState`, the root's own state bundle, which no host can build — keeping it would have
frozen a shape nobody could call. A host that wants the inspector elsewhere composes `bimTree`; a
host that wants ours uses `viewer.ui.bimTree`.

Three modules turned out to have no caller at all and were deleted: `generic/genericPanel.ts` (the
settings popover became a tab of the view panel), `helpers/floating.ts` (only genericPanel used it)
and `settings/settingsItem.ts`.

The bundled declarations went from 171,617 to 149,522 bytes. A test pins the surface, so widening it
again is a deliberate edit rather than a side effect of adding a file.

### 3.3 Declare a browser baseline  ·  **done** (`82796f86`)

WebGL 2 for the viewer, `color-mix()`, `:has()` and `subgrid` for the chrome: Chrome and Edge 117,
Safari 17, Firefox 121. The README carries the table and the reasoning, `browserslist` carries it to
tooling. An older browser still renders the model; it is the chrome's layout that gives way.

---

## Stage 4 — the paperwork

- **[RELEASE_NOTES.md](RELEASE_NOTES.md)** still opens at `1.0.0-alpha.0`. It needs the 1.0.0 entry:
  React removed, the DS UI, the Flex parity work, the capacity gating.
- **[MIGRATION.md](MIGRATION.md)** covers React → Dom well, but claims "no peer dependencies besides
  `three`", which contradicts the manifest until 1.1 is settled. It should also carry whatever 1.1
  decides about three.
- **[DS_PORT.md](DS_PORT.md) and [FLEX_PARITY.md](FLEX_PARITY.md)** are working notes living in the
  repository root. They have served their purpose; move them under `docs/` or `.claude/docs/` so the
  root reads as a published package rather than a workbench.
- **README** should gain the browser baseline (3.3) and a line on what `style.css` costs (3.1).

---

## Explicitly not blocking 1.0.0

Each of these is open, none is a regression, and every one has a named dependency outside this
repository or a deliberate decision behind it.

- **The query-layer parity items** (R9–R13 in [FLEX_PARITY.md](FLEX_PARITY.md)): Flex's filter
  editor, Hierarchy view, display rules, checked-rules vocabulary and zero-match banner. All need a
  database over the model that vim-web does not have.
- **R7, colouring the model by a grouping level.** We could do it without the query layer, but Flex
  is building a successor and we would be copying what it replaces.
- **S5, the per-row settings reset**, and the design system's row centring: both wait on `ds.css`
  gaining SVG paths for its glyph-named icons and centring ink rather than line boxes.
- **The Ultra viewer has no Parameters view.** `bimInfoPanel` is typed to the WebGL `IElement3D`.
- **The tree's scaling ceiling.** Virtualized DOM, but a node object per element, a full-tree
  visibility walk per scene update, and O(n) filtering per keystroke. Verified unchanged from the
  React implementation — `updateVisibility` is byte-identical and both used `@headless-tree/core`
  over a windowed list — so it blocks nothing that was not already blocked. Comfortable into the
  tens of thousands; millions would want lazy children, incremental visibility and an index-based
  model.
- **`capacity.canFollowUrl` on the loading dialog's Ultra link.** Held behind `_addLink = false`
  with a standing TODO; enabling it is a product decision, not a release one.

---

## Order, and what it costs

| | Work | Rough size | State |
|---|---|---|---|
| 1 | three.js packaging (1.1) | — | **done** `69e6870c` |
| 2 | Release workflow (1.2) | — | **done** `10eab583` |
| 3 | Browser baseline (3.3) | — | **done** `82796f86` |
| 4 | Tests: `BimTreeData`, the tree, a smoke test (2.1) | — | **done** |
| 5 | Narrow the public surface (3.2) | — | **done** |
| 6 | Ultra against Flex's server (2.2) | a day | needs the server |
| 7 | The paperwork (Stage 4) | a day | last, so it describes what shipped |
| 8 | Pin the design system to a tag (1.3) | hours | a DS release |
| 9 | Font payload (3.1) | upstream | the DS's new font solution |

Six through nine are what is left: all of them wait on something outside this repository, or are
best done last so they describe what shipped.
