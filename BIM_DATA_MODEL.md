# Working with the VIM BIM data model

*A practical guide for vim-web / HTML consumers reading raw `.vim` files.*

VIM's PowerBI semantic model (TMDL, data model `DM 1.18.0`) encodes a lot of hard-won knowledge about how to interpret the VIM data model correctly. The open-source `vim-web` viewer and HTML consumers read the raw `.vim` directly and must re-derive these patterns themselves. This guide captures the non-obvious ones, table by table.

**Two ground rules up front:**

1. **The PowerBI parquet is wider than the open-source `.vim`.** VIM's BimAudit export pipeline materializes many enrichment columns into the PBIP parquet (e.g. every `*RvtMetric` metric twin, `IsStructural`, pre-split parameter `Value`/`DisplayValue`, the parameter friendly names). These are **not** present in the raw SDK `.vim` and the TMDL does **not** compute them in Power Query — they arrive as `sourceColumn` reads. A raw consumer must derive them itself. Each section flags which columns are PBIP-only.
2. **Native quantities are Revit internal units (decimal feet).** Lengths are in **feet**, areas in **ft²**, volumes in **ft³**, even in a metric model. Multiply by the model's canonical factor `0.3048` (ft→m) — `0.3048²` for area, `0.3048³` for volume. The TMDL never annotates the imperial columns with a unit; this is Revit-internal-units convention, confirmed against live data.

In-engine the tables are pluralized (`CompoundStructureLayers`); the parquet files are singular (`Vim.CompoundStructureLayer.parquet`). SQL examples below use the raw (engine/DuckDB) table names.

---

## 1. Compound structure layers (wall/floor/roof build-up)

A compound structure (multi-layer build-up: finish / insulation / structure / substrate) belongs to a **TYPE**, never to a placed instance. Two walls of the same type share one build-up.

### Data shape (raw `.vim`)

`CompoundStructureLayers` — one row **per layer**:

| column | type | meaning |
|---|---|---|
| `index` | UINTEGER | row key |
| `orderIndex` | INTEGER | layer order within the build-up (0 = first; 0-based) |
| `width` | DOUBLE | layer thickness, **in feet** |
| `materialFunctionAssignment` | VARCHAR | string enum: `Structure`, `Substrate`, `Insulation`, `Finish1`, `Finish2`, `Membrane` |
| `materialIndex` | UINTEGER | FK → `Materials.index` |
| `compoundStructureIndex` | UINTEGER | **FK → `CompoundStructures.index`** |

`CompoundStructures` — one row per build-up: `index`, `width` (total thickness = Σ layer widths, feet), `structuralLayerIndex` (which `orderIndex` is the structural core).

`FamilyTypes` — carries `compoundStructureIndex` (FK → `CompoundStructures.index`) and `elementIndex` (the Element row backing the type).

> **PBIP-only enrichment:** the PowerBI `Vim_CompoundStructureLayer` table additionally exposes `FamilyType`, `FamilyTypeElement`, `Material`, `MaterialName`, `MaterialCategory`, `MaterialSmoothness/Glossiness/Transparency`, `IsStructural`, `CompoundStructureLayerCount`, `CompoundStructureWidth`, and metric twins `WidthRvtMetric` / `CompoundStructureWidthRvtMetric`. All are exporter-materialized — not in the raw `.vim`.

### How to use compound layers

Traverse **instance → its FamilyType → its CompoundStructure → layers**:

1. Element → FamilyType (via the Element↔FamilyType relation; `FamilyTypes.elementIndex` backs the type).
2. `FamilyTypes.compoundStructureIndex` → `CompoundStructures.index`.
3. All `CompoundStructureLayers` where `compoundStructureIndex` = that structure, **ordered by `orderIndex`** (exterior→interior).
4. Per layer: `materialIndex` → `Materials` for name/category; `width` is the layer thickness; layer is structural when `orderIndex == CompoundStructures.structuralLayerIndex`.

The PBIP join shortcut (`Vim_CompoundStructureLayer.FamilyTypeElement → Vim_Element.FamilyTypeElement`, MANY→ONE, bidirectional) is the exporter pre-resolving step 1. Raw consumers must do the `compoundStructureIndex` chain.

### Worked example (live, Structure.vim)

```sql
SELECT ft.name AS typeName, cs.width AS totalWidthFt,
       l.orderIndex, l.width AS layerWidthFt,
       l.materialFunctionAssignment,
       (l.orderIndex = cs.structuralLayerIndex) AS isStructural
FROM FamilyTypes ft
JOIN CompoundStructures cs     ON ft.compoundStructureIndex = cs.index
JOIN CompoundStructureLayers l ON l.compoundStructureIndex  = cs.index
ORDER BY ft.index, l.orderIndex;
-- FS30(Fc24): total 0.98425 ft, layer0 0.98425 ft, "Structure", isStructural=true
-- 0.984251968503937 ft × 0.3048 = 0.3 m → a 300 mm structural slab.
```

> **Gotchas**
> - **Layers belong to the TYPE, not the instance.** Never expect a per-placed-element layer row; reach layers via the element's FamilyType.
> - **The raw FK is `compoundStructureIndex`**, not `FamilyTypeElement`. The clean PBIP join is a flattening the exporter did.
> - **`width` is in feet** (×0.3048 for metres). It is 1-D thickness only — for area/volume takeoff use `MaterialsInElement` (§6), not `width × assumed face area`.
> - **`IsStructural` is derived**, not stored: `layer.orderIndex == CompoundStructures.structuralLayerIndex`.
> - **`materialFunctionAssignment` is a string enum**, not an int. A model may contain only a subset (Structure.vim has only `Structure`).
> - **Not every type has a compound structure** — loadable-family and non-layered system types may have null `compoundStructureIndex`. Join, don't assume.

---

## 2. Rooms & objects-in-rooms

### Data shape

`Vim.Room.parquet` columns: `_key`, `Element`, `Id`, `UniqueId`, `Number`, `Name`, `NamePbiCaseSensitive`, `NumberName`, `UpperLimit`, `BaseOffset`, `LimitOffset`, `UnboundedHeight`, `Volume`, `Perimeter`, `Area`, plus metric twins (`AreaRvtMetric`, `VolumeRvtMetric`, `PerimeterRvtMetric`, `UnboundedHeightRvtMetric`, `LimitOffsetRvtMetric`).

- `NumberName` is the pre-concatenated display label — prefer it for display.
- `Area`/`Volume`/`Perimeter` are imperial (ft²/ft³/ft); the `*RvtMetric` twins are metric, **straight from the parquet** (no unit conversion in the M for Room). Pick the column for your unit system; don't multiply yourself.
- **No `Level` column on the room** (see Gotchas).

### The different ways to deal with rooms — two associations, opposite directions

There are **two** Room links and they mean different things:

**1. `Room.Element → Element._key`** (cardinality **one**, i.e. 1:1) — "a Room *is* an Element." Joins the room to its own element row so it can carry Level / Phase / Parameter context. **Use this to get a room's level, phase, parameters, bounding.**

**2. `Element.Room → ElementInRoom._key`** (default many-to-one) — "what room does this object sit in." `Element.Room` holds the `_key` of the enclosing room. **Use this for objects-in-a-room / room-by-room takeoffs.**

> The Room parquet is loaded **twice** in PBIP: `Vim_Room` (the one-row-per-room dimension) and `Vim_ElementInRoom` (the same file re-imported as the element↔room bridge). Identical `_key` space. A raw consumer should treat `Element.Room` as "the enclosing-room key" and join it to the Room parquet's `_key` — whether you call the target table Room or ElementInRoom is a modelling choice, not a data difference. (A variant TMDL wires `Element.Room → Room._key` directly.)

**Cardinality:** Revit's `Element.Room` stores **one** room per element (the room its location point falls in) — **one room per element, many elements per room**, *not* general many-to-many. An element that physically spans rooms still records only its insertion-point room.

### FromRoom / ToRoom (doors, windows, openings)

On `Vim_FamilyInstance` (from `Vim.FamilyInstance.parquet`): `FromRoom` and `ToRoom` are `int64` **element-index references** to the rooms on each side of a room-bounding instance (almost always doors/windows). **There is NO relationship on them anywhere in the model** — they are raw keys. To resolve a room you join the value yourself to the Room parquet's `_key`. A value of 0 / "no element" means that side opens to nothing (exterior/unplaced). Use case: door/window schedules, egress, adjacency graphs.

### Worked example — room-by-room object takeoff

1. Start from `Vim_Element`, filter to the objects you care about (e.g. a category).
2. Group/slice by `Element.Room` (the enclosing-room key).
3. Resolve the label via the Room parquet: `Room.NumberName` (display), `Room.Area`/`AreaRvtMetric` (density denominator).
4. Count = `Vim_Element` rows per room key; density = `COUNT(elements) / Room.Area`.

For a room's own area schedule, browse `Vim_Room` directly (one row per room) and sum `Area`/`Volume`.

> **Gotchas**
> - **Don't sum room Area through the element join.** The bridge carries full room geometry on every row; aggregating after joining elements counts each room's area once per contained element. Aggregate room geometry from `Vim_Room` only.
> - **`Area = 0` is the best flag for an invalid room** — unplaced, "Not Enclosed" (open boundary loop), or "Redundant" (overlapping) rooms all report `Area = 0`. The TMDL exposes no explicit status/warning code; you must infer from `Area`. Filter `Area > 0` for real placed rooms.
> - **`Element.Room = 0`/null** = object not inside any room. Exclude before computing "% of objects in rooms."
> - **One room per element only** — multi-room objects are under-counted by design.
> - **No `Room.Level` field** — get a room's level via `Room.Element → ElementLevelInfo.Element → ElementLevelInfo.PrimaryLevel → LevelPrimary`.
> - **Two unit systems ship side-by-side** — never convert the imperial column yourself; the metric is already supplied.

---

## 3. Phases & phase filters

### Data shape (3 tables + 2 Element columns)

`Vim.Phase.parquet` → `Vim_Phase`: `_key`, `Element` (a phase is itself an element), `Name`, `NamePbiCaseSensitive`, `Id`, `UniqueId`. The TMDL LEFT-joins `OrderIndex` onto every phase from `PhaseOrderInBimDocument`.

`Vim.PhaseOrderInBimDocument.parquet`: `bimDocumentIndex`, `phaseIndex`, `orderIndex`, `index`. **Phase order is per-BimDocument** — the same phase can have a different `OrderIndex` in different linked documents.

`Vim.PhaseFilter.parquet` → `Vim_PhaseFilter`: one row per phase-filter, with `Name`/`NamePbiCaseSensitive` and **four string columns** `New`, `Existing`, `Demolished`, `Temporary` (renamed in M from the parquet's `NewStr`/`ExistingStr`/`DemolishedStr`/`TemporaryStr`). Each holds the *presentation behavior* for an element in that phase state.

`Element.PhaseCreated` / `Element.PhaseDemolished`: both `int64`, both phase `_key` references.

**Relationships:** only `PhaseFilter.Element → Element._key` (one) and `Element.PhaseCreated → Phase._key` are active. **`PhaseDemolished` has no relationship** (it would be an ambiguous second path to the same table).

### Correct usage — existence vs presentation

These are **two separate questions**:

**Existence** — an element's lifespan is `[PhaseCreated, PhaseDemolished)` expressed as **OrderIndex**. Element exists in phase P when:
`created.OrderIndex <= P.OrderIndex` AND (`not demolished` OR `P.OrderIndex < demolished.OrderIndex`).

**Presentation** — the four PhaseFilter strings drive *how* an element renders, not whether it exists. Map element→status first (New if created==active phase; Existing if created earlier; Demolished if demolished in active phase; Temporary if created & demolished within it), then look up that status's string in the chosen PhaseFilter row.

### Worked example

Active phase = "New Construction" (OrderIndex 1). Element `PhaseCreated`→OrderIndex 0 ("Existing"), no `PhaseDemolished`.
- Existence: `0 <= 1` and not demolished → **exists** in the active phase.
- Status: created *before* active → **Existing**.
- Look up `PhaseFilter[Existing]` for the selected filter → that string tells the viewer how to draw it (e.g. with category graphics rather than hide/override).

> **Gotchas**
> - **Order phases by `OrderIndex`, never by `_key`/`Id`/`Name`.** Only `PhaseOrderInBimDocument.OrderIndex` (per `bimDocumentIndex`) is the construction sequence.
> - **OrderIndex is per BimDocument** — don't compare across documents. A LEFT join leaves a phase absent from the order table with a **blank** `OrderIndex`; guard for nulls.
> - **PhaseFilter values are pre-resolved STRINGS** (from the parquet `*Str` columns); the model drops the integer-code variants. A consumer reading the *numeric* PhaseFilter columns must map them itself.
> - **The presentation vocabulary (By Category / Overridden / Not Displayed) is NOT enumerated in the TMDL.** Zero literal matches across all scripts; no integer→string CASE map. Do **not** hardcode one from the TMDL — verify against the Revit exporter / `as.predefined`. This is the one place the data model does *not* encode the knowledge.
> - **PhaseFilter is per-element-context (cardinality ONE to Element)**, not a small static lookup. Phase-filter definitions can diverge across linked models — scope phase + filter resolution **per BimDocument**, not globally.
> - **Use `NamePbiCaseSensitive` for joins/dedup**; `Name` is display-only (phase names can collide case-insensitively).

---

## 4. Levels & element-to-level containment

### The three tables

| Table | Source | Role |
|---|---|---|
| `Vim_Level` | raw `Vim.Level.parquet` | One row per Level element. The dimension. |
| `Vim_LevelPrimary` | **derived** from `Vim.Level.parquet` | Level rows + cross-model alignment status. The table elements actually join to. |
| `Vim_ElementLevelInfo` | raw `Vim.ElementLevelInfo.parquet` | One row per element: its level assignments + geometric containment. |

**Relationships:** `ElementLevelInfo.Element → Element._key` (**one** level-info row per element); `ElementLevelInfo.PrimaryLevel → LevelPrimary._key` (default many-to-one). **This is the only wired level relationship.** The other level columns — `ScheduleLevel`, `Level`, `HostLevel`, `ReferenceLevel`, `BaseLevel` (all `int64`) — are raw element-index references with **no relationship**; inert in the model.

### `Vim_ElementLevelInfo` columns

- `Element` — FK to `Element._key`.
- `PrimaryLevel` — the single "best" level pick → `LevelPrimary._key`. **The answer to "what level is this on."**
- `PrimaryLevelKind` (string) + `PrimaryLevelKindEnum` (int) — which reference `PrimaryLevel` came from.
- **Geometric containment** (the headline feature, all `sourceColumn` from parquet):
  - `BuildingStoryGeometryContainmentEnum` (int, 0–6 code)
  - `BuildingStoryGeometryContainment` (string label)
  - `BuildingStoryGeometryContainmentColor` (hex string for swatches)
  - `BuildingStoryGeometryMinLevel` / `BuildingStoryGeometryMaxLevel` (level **indices**) — lowest/highest building stories the element's geometry bounding box intersects.
- One computed column: `BuildingStoryGeometryContainmentRanked = Enum & " - " & Containment`.

**`PrimaryLevel` vs containment are different questions.** `PrimaryLevel` = the level the element is *assigned/hosted to*. The `BuildingStoryGeometry*` columns = which stories the element's *geometry physically spans*. A 3-storey curtain wall has ONE `PrimaryLevel` but a Min..Max spanning three stories.

### Elevation has many flavors

`Vim_Level` / `Vim_LevelPrimary` expose: `Elevation` (internal model value), `ProjectElevation` (the value the Revit Levels dialog shows — **not the same number**), plus three reference frames each in feet-decimal / feet-and-fractional-inches / meters (`ElevationRelativeToProjectBasePoint*`, `ElevationRelativeToSurveyPoint*`), `IsRelativeToProjectBasePoint` (which frame the bare `Elevation` uses), pre-formatted display labels (`NameWithElevation*`), `IsBuildingStory` (bool), `IsStructural`, `LevelTypeName`, `BuildingStoryAbove`.

### Cross-model level alignment (the `Vim_LevelPrimary` computation)

The derived table compares every linked model's levels against **Building 0 (the coordination/host)**, matched **by `Name`**: computes `DeltaProjectBasePoint*`/`DeltaSurveyPoint*`, applies `Tolerance = 0.001 ft` → `IsAlignedProjectBasePoint` / `IsAlignedSurveyPoint` / `IsFullyAligned`, and emits status text `"Reference"` (Building 0) / `"Missing"` (no same-named level) / `"Aligned"` / a signed offset like `"+0.5 ft"`. Raw `Vim.Level.parquet` does **not** have this — a raw consumer must re-implement it.

### Worked example

```sql
SELECT e._key,
       lp.Name                 AS primary_level,
       lp.ProjectElevation,
       eli.PrimaryLevelKind,
       eli.BuildingStoryGeometryContainmentEnum,
       eli.BuildingStoryGeometryContainment,
       eli.BuildingStoryGeometryMinLevel,
       eli.BuildingStoryGeometryMaxLevel
FROM      ElementLevelInfo eli
JOIN      Element  e  ON eli.Element = e._key
LEFT JOIN Level    lp ON eli.PrimaryLevel = lp._key   -- LEFT: many elements have none
WHERE     e._key = :id;
```

> **Gotchas**
> - **`Elevation` ≠ `ProjectElevation`.** Plus two external reference frames (Project Base Point, Survey Point), each in 3 unit formats. `IsRelativeToProjectBasePoint` tells you which frame the bare `Elevation` uses.
> - **Not every Level is a building story.** Filter `IsBuildingStory = true` before treating a level as an occupiable floor; the `BuildingStoryGeometry*` math runs against building-story levels only.
> - **Many elements have no `PrimaryLevel`** (site, project-info, some MEP, annotation). Use a LEFT JOIN and bucket nulls as "(no level)".
> - **Only `PrimaryLevel` is relationship-backed** — group by it, not the other loose level columns, to match PowerBI.
> - **The 0–6 containment codes are NOT defined in the TMDL.** `…Enum`, `…Containment` (label), `…Color` are all `sourceColumn` reads; the exporter bakes in the int↔label↔color mapping. **Read the baked `…Containment` string** rather than reconstructing it from the enum — the enum→name contract lives in the exporter, not here.
> - **Cross-model alignment matches on level *Name*** — a renamed-but-same-elevation level reads "Missing"; an aligned-elevation-but-different-name level won't pair. Known heuristic limitation.
> - **`MinLevel`/`MaxLevel` are level indices, not elevations** — resolve through the level table; span height = the two levels' `ProjectElevation` difference.

---

## 5. Nested / embedded / hosted families

There are **three independent mechanisms** for "X is inside/attached to Y", and they are NOT interchangeable.

### The shapes

**`Vim.ElementHierarchy.parquet`** — the geometric/spatial containment tree, one row per ancestor→descendant pair. It is a **transitive closure**, not just parent→child edges:
- `Element` → ancestor element index (FK → `Element._key`)
- `Descendant` → descendant element index
- `DescendantNodeIndex`, `DescendantGeometryIndex` — scene-graph node / geometry indices
- `Distance` — depth below `Element` (immediate child = 1; self-row = 0)
- `RootDistance` — depth below the root of the tree
- `IsSelf` (bool) — TRUE on the self-pair row (`Element == Descendant`)

**`Vim.FamilyInstance.parquet`** — Revit family-instance semantics, one row per instance:
- `Element` (FK → `Element._key`, the only active relationship on this table)
- `Host` — the element this instance is **hosted by** (door→wall, light→ceiling). Raw FK index.
- `SuperComponent` — the **parent assembly / nested-family** this is a sub-component of (curtain panel→curtain wall).
- `SuperComponentDistance` — nesting depth under the super-component (top-level = 0).
- `FromRoom` / `ToRoom`, `FamilyType`, `Name`.

> `Host`, `SuperComponent`, `FromRoom`, `ToRoom` are raw `int64` index columns with **NO relationship defined** — multiple of them point back into `Element`, which would be ambiguous. **Resolve them manually by index into `Element._key`.**

### Host vs SuperComponent vs ElementHierarchy

| Concept | Column(s) | Captures | Example |
|---|---|---|---|
| **Host** | `FamilyInstance.Host` | Revit *hosting* (carved into / face-mounted) | Door in a wall; sprinkler in a ceiling |
| **SuperComponent** | `SuperComponent` + `SuperComponentDistance` | Revit *nested-family* parentage | Panel in a curtain wall; sub-family in an assembly |
| **ElementHierarchy** | `Element`→`Descendant` + `Distance`/`IsSelf` | Engine-resolved geometric containment closure (the superset) | All of the above + group members + geometry sub-nodes |

`Host`/`SuperComponent` are Revit-authored facts; `ElementHierarchy` is the engine's geometric tree (generally a superset). Use Host/SuperComponent for Revit's semantic intent; use ElementHierarchy for everything the geometry nests.

The model also **promotes `SuperComponentDistance` onto every element** as `Element.FamilyInstanceSuperComponentDistance` — so you can de-nest **without joining FamilyInstance at all**.

### Worked example — counting without double-counting

A curtain wall explodes into hundreds of panels/mullions; assemblies expand into sub-families. The promoted column is the de-nest key:

```sql
-- Top-level elements only (exclude nested sub-components):
SELECT COUNT(*) FROM Element
WHERE FamilyInstanceSuperComponentDistance = 0    -- 0 = top-level instance
   OR FamilyInstanceSuperComponentDistance = -1;  -- -1 = not a sub-component at all
```

Resolving a door's host wall:
```sql
SELECT d.Element AS door, d.Host AS wall_key, w.Name AS wall_name
FROM FamilyInstance d
JOIN Element w ON w._key = d.Host
WHERE d.Host <> -1;        -- -1 = no host
```

> **Gotchas**
> - **`-1` is the "no value" sentinel everywhere** — `Host`, `SuperComponent`, `FromRoom`, `ToRoom`, `FamilyInstance`, `FamilyTypeElement`, `FamilyElement` all use `-1` (not null, not 0). A consumer joining on `0` will silently grab element `_key = 0`.
> - **`ElementHierarchy` is a transitive closure with self-rows.** A naïve `COUNT(*)`/`JOIN` massively over-counts. Filter: `Distance = 1` (immediate children), `IsSelf = FALSE` (real descendants), `IsSelf = TRUE` (the element itself).
> - **`Host` ≠ `SuperComponent`.** A door is *hosted* by a wall but has no SuperComponent; a curtain panel has a SuperComponent but isn't "hosted". Don't merge them.
> - **De-nesting depth is already on the element** (`FamilyInstanceSuperComponentDistance`) — you don't need to join FamilyInstance to drop nested sub-components.
> - **For physical-object counts**, combine the de-nest filter with `IsInstance = true` and the physical-vs-non-physical category logic — family *Types* and *Families* appear as Element rows but are conceptual, with `IsInstance = false`.
> - In PBIP, `Descendant` resolves to a calculated clone `Vim_ElementEmbedded` (PBI can't have two active relationships to `Element`); raw consumers should resolve `Descendant` straight to `Element._key`.

---

## 6. Materials & quantities (material takeoff)

### Data shape

**`Vim.MaterialInElement.parquet`** — one row per *material-in-an-element* (an element with N materials → N rows):

| column | type | meaning |
|---|---|---|
| `_key` | int64 | row key |
| `Element` | int64 | FK → `Element._key` (many rows per element) |
| `Material` | int64 | FK → `Material._key` |
| `Area` | double | painted/material surface area, **ft²** |
| `Volume` | double | solid material volume, **ft³** |
| `IsPaint` | int64 | 0/1 flag |
| `AreaRvtMetric` | double | same area in **m²** (pre-baked in parquet) |
| `VolumeRvtMetric` | double | same volume in **m³** (pre-baked in parquet) |

**`Vim.Material.parquet`** — one row per distinct material (the lookup): `_key`, `Name`, `MaterialCategory`, `NamePbiCaseSensitive`, `Id`, `UniqueId`.

The only transform the TMDL does is a LEFT-outer join `MaterialInElement.Material → Material._key`, expanding `Name`/`MaterialCategory`/etc. with a `Material.` prefix. **Relationship:** `MaterialInElement.Element` (many) → `Element._key` (one).

### Correct takeoff pattern

1. Read `MaterialInElement`; LEFT-join `Material` on `_key` to get `Material.Name` / `Material.MaterialCategory`.
2. **Group by material** (`Material._key` or `Material.Name`), then `SUM(Volume)` for solid quantity and/or `SUM(Area)` for surface quantity.
3. Convert to metric: **m² = ft² × 0.09290304**, **m³ = ft³ × 0.028316846592** — or just sum `VolumeRvtMetric`/`AreaRvtMetric`.

### Worked example

A wall (`Element = 1234`) of 2 materials yields 2 rows:

| Element | Material.Name | Volume (ft³) | Area (ft²) | IsPaint |
|---|---|---|---|---|
| 1234 | Concrete - Cast-in-Place | 42.0 | — | 0 |
| 1234 | Paint - White | 0 | 210.0 | 1 |

Concrete = `SUM(Volume) WHERE Material.Name='Concrete…'` = 42.0 ft³ → ×0.0283168 = **1.189 m³**. Paint = `SUM(Area) WHERE IsPaint=1` = 210 ft² → ×0.0929 = **19.5 m²**.

> **Gotchas**
> - **`IsPaint=1` rows are a painted *surface*, not a solid** — meaningful `Area`, typically `Volume=0`. Never add paint rows into a volume takeoff.
> - **One element = many rows → never join-and-sum naively.** Joining MaterialInElement to any other one-to-many table (parameters, levels, rooms) before aggregating **fans out and double-counts**. Aggregate to your grain *first*, then join.
> - **`Material` FK is left-outer** — rows can have a null/unmatched material; bucket as "Unassigned", don't drop.
> - **MaterialInElement ≠ CompoundStructureLayer.** Layers carry thickness (`WidthRvtMetric`), `MaterialName`/`MaterialCategory`, and **no Area/Volume**, per-*type*. Use MaterialInElement for actual per-instance area/volume; use layers only for thickness/composition. Don't multiply layer widths by element counts as a volume substitute.
> - **Material ↔ category line color is NOT in this model.** `Vim.Category.parquet` natively has `LineColor.X/Y/Z` and a category-default `Material`, but the semantic model **explicitly drops all four** (`RemoveColumns({"LineColor.X","LineColor.Y","LineColor.Z","Material","Parent"})`). A viewer wanting category line color must read `LineColor.X/Y/Z` (RGB) from the raw `Vim.Category.parquet`. The category's default `Material` is distinct from per-element `MaterialInElement.Material` — don't conflate them.
> - **`MaterialCategory` lives on the Material lookup**, not on MaterialInElement — you get it only after the join. It's the right field to roll up by material family.
> - **Use `NamePbiCaseSensitive` for de-duplication**; `Name` is case-folded. Prefer `_key`/`UniqueId` as the stable identity, not `Name`.

---

## 7. Parameters

Reading a parameter for an element is the single most error-prone part of consuming raw `.vim`. Three non-obvious things: the **instance/type/family fan-out join**, the **`native|display` value encoding**, and the PBIP **denormalization**.

### Data shape (raw `.vim`)

- `Parameters` — the fact table: `index`, `value` (VARCHAR), `parameterDescriptorIndex` (→ `ParameterDescriptors.index`), `elementIndex` (→ `Element.index`). **No name, no group, no units on the value row.**
- `ParameterDescriptors` — the dimension (far fewer rows): `index`, `name`, `groupName`, `parameterType`, `isInstance` (BOOL), `isShared` (BOOL), `isReadOnly` (BOOL), `flags` (INT), `guid`, `displayUnitIndex`.

**Every human-readable attribute lives on the descriptor.** Join `Parameters.parameterDescriptorIndex → ParameterDescriptors.index` (many-to-one) to know what a value means.

> **PBIP-only:** `Vim_Parameter` is denormalized — its parquet already carries `Name`, `Group`, `IsInstance`, `IsShared`, `IsReadOnly`, `Guid`, `ParameterType`, `StorageType`, `DisplayUnitLabel`, plus pre-split value columns `Value`, `DisplayValue`, `Quantity`, `QuantityInFeetRvtOrDisplayValue`, `QuantityInMetersRvt`, `QuantityInMetersRvtOrDisplayValue`. These are produced by the export pipeline — **not** in the raw SDK parquet, **not** computed in the TMDL M. A raw consumer must reproduce them.

### Pattern 1 — the fan-out join (most important)

A parameter's `elementIndex` may point at an **Item, a FamilyType, or a Family**. Type/family parameters are stored once but logically apply to every instance. The PBIP `Vim_ElementParameter_Join` (and a raw consumer) must:

- Keep only **leaf/Item** elements: `WHERE ElementKindIsLeaf = true`.
- Build a `(Element, Parameter_Element)` mapping as a **3-way union**:
  - **Instance**: `Element._key → itself`
  - **Type**: `Element.FamilyTypeElement → Element._key` (where `FamilyTypeElement > -1`)
  - **Family**: `Element.FamilyElement → Element._key` (where `FamilyElement > -1`)
- `Distinct` the union, then inner-join `Parameters` on the param's own `Element` to the mapping's source.

Net effect: a parameter authored on a FamilyType resolves onto **every leaf instance of that type**. Naively joining `Parameters.elementIndex = Element.index` **misses every type and family parameter** on instances.

### Pattern 2 — decode the value (`native|display`)

Raw `value` is a single pipe-delimited string `<native>|<display>` (confirmed on live data; this encoding is **not** in the TMDL — it's how the raw `.vim` stores it):
- `"500| 1 : 500"`, `"3|Fine"`, `"0|No"`, `"-1|<None>"`, `"1000|304800"` (Far Clip Offset: 1000 ft native, 304800 mm display), `"0|フェーズ1"` (localized).
- **Left of `|` = native/raw** — for lengths/areas/volumes it's **Revit internal feet/ft²/ft³**; for enums/bools/elementIds it's the raw integer; `-1` usually means None/unset. **Compute on this.**
- **Right of `|` = localized, unit-formatted display string.** Show this; don't parse it numerically across models.
- Handle the no-`|` case (`"-1"`) and empty-display (`"0|"`).

### Pattern 3 — identify the kind

- `isInstance` → instance vs type parameter. **Type confusion:** BOOL in raw + `Vim_Parameter`, but int64 (0/1) in `Vim_ParameterSummary_Descriptor`.
- `parameterType` is an **Autodesk Forge spec URI** (`autodesk.spec.aec:length-2.0.1`, `…:area-2.0.0`, `…:volume-2.0.0`, `autodesk.spec:spec.bool-1.0.0`, `…currency-2.0.0`, etc.). **Empty string is common** for enum/elementId-backed built-ins (View Scale, Detail Level, Phase) — the display half carries the label; don't treat empty as "no data".
- `flags` (renamed `Class` in PBIP) is a small enum (observed 0/1/2), not a bitfield.
- `displayUnitIndex` is an **index** into a unit table; raw parquet ships no label.

### Worked example

```sql
SELECT d.name, d.groupName, d.parameterType, d.isInstance, d.displayUnitIndex,
       p.value,
       split_part(p.value, '|', 1) AS native_ft,        -- 1000 (Revit feet)
       split_part(p.value, '|', 2) AS display_localized  -- "304800" (already mm)
FROM Parameters p
JOIN ParameterDescriptors d ON p.parameterDescriptorIndex = d.index
-- ...resolve via the instance/type/family fan-out (pattern 1) to reach the element
WHERE d.name = 'Far Clip Offset';
-- metric yourself: native_ft * 0.3048
```

> **Gotchas**
> - **The fan-out join is mandatory** — straight `elementIndex` joins drop all type/family parameters from instances. Filter `ElementKindIsLeaf = true` first.
> - **`value` is `native|display`, not a clean number** — split on the *first* `|`; native (left) for math, display (right) for showing.
> - **Native lengths/areas/volumes are Revit internal feet**, not the document's display units; the display half is already converted. Mixing them corrupts takeoffs.
> - **Raw parquet has none of the friendly/`Value`/`DisplayValue`/`Quantity` columns** — derive them.
> - **`-1` native usually means None/unset** (`"-1|<None>"`).
> - **`Vim_ParameterDescriptor` is query-only in PBIP** — folded into `Vim_Parameter`; don't expect a standalone descriptor dimension in the `.pbix`.
> - **Reproducing the audit semantics:** PBIP marks `IsEmpty=1` (blank), `IsDubious=1` (filled-but-suspect), `IsValid = IsEmpty=0 AND IsDubious=0`; the descriptor rollup buckets `PercentFilled`/`PercentQuality` onto a fixed 7-point score. These are VIM conventions, not in raw data.

---

## 8. Other relationships (systems, links, worksets, groups, grids, base points)

Most of these are raw parquet passthroughs, but four patterns are non-obvious.

**MEP Systems — `Vim_ElementInSystem` + `Vim_System`.** `ElementInSystem` is the element↔system junction (`_key`, `System`, `Element`, `Roles`). The System columns are pre-joined **in M, not via a relationship** (`NestedJoin` on `System → Vim_System._key`, expanded with a `System.` prefix) — a raw consumer must do that join itself. The load-bearing derived column is **`IsAssigned`**: `if System.Type = null then 0 else if Text.Contains(System.Type, "Unassigned") then 0 else 1` — Revit emits placeholder "Unassigned" systems for un-wired MEP elements. *Gotchas:* an element can have multiple `ElementInSystem` rows (de-dup on `Element` for per-element rollups); `IsAssigned` is a string substring test, so it's localization-fragile; `Roles` is a raw int64 with no decode in the TMDL.

**Linked models — `Vim_RevitLinkInfo`.** A fat **native** passthrough: the exporter already wrote the alignment math. **Read the pre-computed columns, don't recompute** — booleans `ProjectBasePointsAreAligned` / `SurveyPointsAreAligned`, deltas `ProjectBasePointDelta_X/Y/Z` / `SurveyPointDelta_X/Y/Z`, plus link/parent base+survey point coordinates and a text `SummaryMetric`. Joins to `Vim_BimDocument` via `LinkBimDocument` (a document key, not an element key). *Gotcha:* the boolean format string renders both true and zero-but-nonblank as "TRUE" — read the raw boolean, not the formatted string.

**Worksets — `Vim_Workset`.** Passthrough: `_key`, `BimDocument`, `Name`, `Kind`, `Owner`, `UniqueId`, `Id`, `IsOpen`, `IsEditable`. Attach to elements via `Element.Workset → Workset._key`. *Gotchas:* `IsOpen`/`IsEditable` are int64 0/1 (test `== 1`, not truthiness); `Owner` is a point-in-time checkout snapshot; the same workset *name* can exist in multiple linked docs as distinct rows (scope by `BimDocument`).

**Groups & Grids — `Vim_Group`, `Vim_Grid`.** Passthroughs. Group attaches via `Element.Group → Group._key`; Grid has its own `Grid.Element → Element._key` (cardinality one). Grid length is a derived DAX column `XYLength = SQRT(POWER(Max.X−Min.X,2)+POWER(Max.Y−Min.Y,2))` — **plan/XY only, ignores Z**; there's no native length column. Same dual-name pattern (group on `Name`, display `NamePbiCaseSensitive`).

**Project Base Point vs Survey Point — `Vim_BasePoint`.** The richest transform in the model (non-foldable). **One parquet holds both points, split on the `IsSurveyPoint` 0/1 flag** — they are not separate tables. The M builds a per-BimDocument coordinate-alignment report: default units **feet** (`UseMetric=false`, `UnitFactor=1`), tolerances `ToleranceAligned=0.0003 ft` / `ToleranceWarning=0.003 ft`, status verdicts `"✓ Aligned"` / `"⚠ Warning"` / `"✗ Error"`, baseline = first row (`Row0`). *Gotchas:* Internal Origin vs Project Base Point vs Survey Point are three distinct things — don't conflate; Survey-Point "not set" (all-zero) is the soft `"⚠ Aligned, but Survey Point not set (0,0)"`, **not** an error; baseline is whatever sorts first, so anchor to the `IsHost` row explicitly rather than assume row 0.

**Design Options — NOT a table.** There is no `Vim_DesignOption` table and no `Vim.DesignOption.parquet`. If you need design-option membership, derive it from element categories/parameters. **Do not invent one.**

---

