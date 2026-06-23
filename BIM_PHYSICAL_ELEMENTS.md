# Physical vs Non-Physical Elements

A VIM file (from Revit) contains the **whole project database**, not just the building you see: families, types, annotations, views, cameras, levels, and linked content all live as elements alongside the placed objects. Code that counts, charts, or filters the raw element/category tables without accounting for this produces numbers that **look right but silently over-count**.

## TL;DR — the rule

> For counts, schedules, take-offs, and most 3D views of a Revit model, keep only **physical placed instances**: `Domain == "Physical"` **and** `IsInstance == true`.

> **Do not use geometry presence as the gate.** `hasGeometry` answers *"did Revit emit a mesh?"*, not *"is this a placed object?"*. A lazily-2D door, a seat modelled in 2D, or an embedded door-opening family are real placed instances with little or no mesh — a geometry gate silently drops them. Use `hasGeometry` only as a render hint (e.g. whether to attempt isolating an element in 3D).

## Why it matters — the trap

Group elements by category/family/type with no filter and you get rows like `Structural Framing › FamilySymbol › 96`. Those `FamilySymbol` rows are **type definitions, not 96 placed beams**. The same trap inflates "floor" counts with floor *types*, "category" totals with annotation categories, and element totals with cameras, levels, and views.

## The data model

`Element` is the central table; almost everything references it. The catch: **definitions are also elements.** A `Family` and a `FamilyType` (a "type" / *FamilySymbol*) are rows in the element space, right next to the instances — as are levels, views, cameras, phases, and materials. They have no physical presence but appear in any naive query.

Each element carries a Revit class (`element.type`), a category (`element.category`, with `builtInCategory` = the `OST_*` code and `categoryType` = Model / Annotation / Internal / AnalyticalModel), and a family / family-type when it is family content.

## The classification, precisely

VIM's data tooling classifies every element into a `CategoryDomain` by crossing a category **Domain** with **ElementKind**:

| Class | What it is | Physical? |
|---|---|---|
| `Physical - Instance` | placed building objects (a beam, a floor) | ✅ keep |
| `Physical - Not Instance` | type defs in physical categories | ❌ |
| `Conceptual - Family Type` | type definitions (FamilySymbols) | ❌ |
| `Conceptual - Family` | family definitions | ❌ |
| `Annotation` | dimensions, tags, views, cameras… | ❌ |
| `Link - Instance` / `Link - Not Instance` | linked-model content | usually separate |
| `Conceptual` | openings, datums, no-category | ❌ |

`Domain` is a lookup of `category.builtInCategory` (the `OST_*` code) against an `OST_* → Domain` map. `Physical`, `Annotation`, `Link`, `Group`, `Conceptual`, `Symbol`, `System` are the buckets. Notably, **openings (`OST_ShaftOpening`, `OST_StructuralFramingOpening`) map to `Conceptual`, not Physical** — exclude them by default.

## Deriving it from the data available today

The element/category tables expose `type`, `builtInCategory`, and family/family-type/family membership — enough to reconstruct the rule (no geometry, no `categoryType` shortcut — `categoryType == 'Model'` cannot separate Physical from Link and mis-buckets openings/cameras/levels which are all `Model`-typed but `Conceptual`):

```ts
const DEF_CLASS = /(Type|Symbol)$/                          // FloorType, WallType, FamilySymbol, ViewFamilyType
const SYSFAM = /^(Floor|Wall|Ceiling|Roof|Stairs|Railing|Ramp)$/

const elementKind = (e: Element): 'Family' | 'Family Type' | 'Instance' => {
  if (inFamilyTable(e) || e.type === 'Family' || e.type === 'System Family') return 'Family'
  if (inFamilyTypeTable(e) || DEF_CLASS.test(e.type) || e.type === 'System Family Type') return 'Family Type'
  return 'Instance'
}

// IsInstance must be gated by elementKind: raw FamilyInstance-table membership is
// contaminated with Groups, Cameras (type 'Element') and Levels.
const isInstance = (e: Element) =>
  elementKind(e) === 'Instance' && (inFamilyInstanceTable(e) || SYSFAM.test(e.type))

const categoryDomain = (e: Element): string => {
  const k = elementKind(e)
  if (k === 'Family Type') return 'Conceptual - Family Type'
  if (k === 'Family') return 'Conceptual - Family'
  const d = OST_DOMAIN[e.category?.builtInCategory] ?? null
  if (d == null) return 'Conceptual'
  if (d === 'Physical') return isInstance(e) ? 'Physical - Instance' : 'Physical - Not Instance'
  if (d === 'Link') return isInstance(e) ? 'Link - Instance' : 'Link - Not Instance'
  return d
}

const isPhysical = (e: Element) => categoryDomain(e) === 'Physical - Instance'
```

`OST_DOMAIN` is the `OST_* → Domain` map (~1,200 rows, derived from Revit's BuiltInCategory enum). Treat it as static reference data — it is per-format, not per-model.

## Quick reference — what is *not* a physical element

FamilySymbols / family types · Families · Openings (Conceptual) · Materials · Levels · Grids · Views · Sheets · Schedules · Cameras · Phases · Project Base Point · Survey Point · Dimensions · Tags · Text notes · Reference planes · Model Groups · Rooms / Areas (logical) · linked-model placeholders.

## Note for maintainers

`isInstance`, `elementKind`, and a category `domain` are derived downstream in the VIM → Parquet / Power BI pipeline but are not surfaced on the element/category data here, so every consumer must re-derive the rule. Exposing them directly on `IElement` / `ICategory` (and shipping the `OST_* → Domain` map) would let consumers classify physical elements without re-implementing — and without falling into the `hasGeometry` trap.
