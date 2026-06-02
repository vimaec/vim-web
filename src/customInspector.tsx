import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import * as VIM from './vim-web'

const Webgl = VIM.React.Webgl
type ViewerApi = VIM.React.Webgl.ViewerApi
type IWebglVim = VIM.Core.Webgl.IWebglVim
type IElement = VIM.BIM.IElement
type VimDocument = VIM.BIM.VimDocument

// The renderer's raw-object add/remove (present on the concrete Renderer but not
// the public IWebglRenderer type). We use it to add our own THREE meshes.
type RawSceneRenderer = { add(o: VIM.THREE.Object3D): void; remove(o: VIM.THREE.Object3D): void }

// Shape of the internal merged submesh we read geometry from. Reaching into
// these internals is deliberate — the custom room mesh lives outside the
// viewer's tracking on purpose.
type MergedSubmeshLike = { merged: boolean; three: VIM.THREE.Mesh; meshStart: number; meshEnd: number }

// Sample model used for the initial load.
const RESIDENCE_URL = 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'

/**
 * Custom project inspector.
 *
 * The built-in BIM tree exposes no API to control its structure or labels
 * (only a visibility toggle), so this demo hides it (`ui.panelBimTree: false`)
 * and renders its own tree in a left pane instead. The built-in BIM info panel
 * is hidden too (`ui.panelBimInfo: false`) and replaced by a "BIM Inspector"
 * section below the tree, populated from the current selection.
 *
 * The tree groups every geometry element by:
 *   Room > Category > Family > Type > Element
 *
 * Each level is just an extractor function over the BIM `IElement` (see LEVELS
 * below) — reorder or swap them to change the hierarchy. Clicking a leaf
 * selects and frames that element in the 3D scene. A single viewer is reused
 * across loads: each load unloads the previous vim and loads the new one into
 * the same viewer.
 */
export function CustomInspector () {
  const viewerDiv = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<ViewerApi | undefined>(undefined)
  const vimRef = useRef<IWebglVim | undefined>(undefined)
  const unsubRef = useRef<(() => void) | undefined>(undefined)
  // Self-owned THREE meshes visualizing selected rooms, keyed by room-volume
  // element index. We render our own meshes rather than toggling the rooms' VIM
  // elements because room geometry is opaque-authored and `isRoom` visibility is
  // owned by the global showRooms flag — so the engine won't let us show rooms
  // as transparent shells. Standalone meshes sidestep all of that: total control
  // over material and visibility, untracked by the viewer. Multiple rooms can be
  // shown at once (one entry per selected room row).
  const roomMeshesRef = useRef<Map<number, VIM.THREE.Mesh>>(new Map())
  const bimToken = useRef(0) // guards against out-of-order async BIM-info loads
  // True while the inspector is pushing a selection into the viewer. The
  // viewer fires onSelectionChanged in response; this flag lets the listener
  // ignore that echo so an inspector click can't loop back into itself.
  const applyingSelfRef = useRef(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string>()
  const [loadError, setLoadError] = useState<string>()
  const [tree, setTree] = useState<TreeItem[]>()
  const [bimInfo, setBimInfo] = useState<BimInfo>()
  // The set of selected BIM element indices. Mirrored in a ref so click
  // handlers can read the latest value without a stale closure.
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set())
  const selectedRef = useRef<ReadonlySet<number>>(selected)
  const updateSelected = (next: ReadonlySet<number>) => {
    selectedRef.current = next
    setSelected(next)
  }

  // Creates the single, long-lived viewer (once) and wires up selection sync
  // and the room-toggle control-bar button. Subsequent loads reuse it.
  const ensureViewer = async (): Promise<ViewerApi | undefined> => {
    if (viewerRef.current) return viewerRef.current

    const div = viewerDiv.current
    if (!div) return undefined

    // Hide the built-in BIM tree, its control-bar toggle, and the BIM info
    // panel so this custom inspector visually replaces the stock UI. Ghost
    // opacity is dialed down so hidden rooms nearly vanish and only our custom
    // shells read as room geometry.
    const viewer = await Webgl.createViewer(div, {
      ui: { panelBimTree: false, miscProjectInspector: false, panelBimInfo: false },
      isolation: { ghostOpacity: 0.01 },
    })
    viewerRef.current = viewer
    ;(globalThis as any).viewer = viewer // for testing in the browser console

    // Sync selections made in the viewport back into the tree highlight. We
    // ignore echoes from our own inspector-driven selections (recursion guard)
    // and never expand rows here — only update the highlight.
    const selection = viewer.core.selection
    unsubRef.current = selection.onSelectionChanged.sub(() => {
      if (applyingSelfRef.current) return
      const next = new Set<number>()
      for (const s of selection.getAll()) {
        if (s.type === 'Element3D' && s.element !== undefined) next.add(s.element)
      }
      updateSelected(next)
      loadBimInfo(firstOf(next))
    })

    // Append a toggle button to the control bar for room geometry. The
    // callbacks read live state, and `isOn` highlights the button while rooms
    // are shown. Returning [...bar, …] keeps the built-in sections.
    const showRooms = viewer.renderSettings.showRooms
    const Icons = VIM.React.Icons
    viewer.controlBar.customize((bar) => [
      ...bar,
      {
        id: 'custom-rooms',
        buttons: [{
          id: 'toggle-rooms',
          tip: () => (showRooms.get() ? 'Hide rooms' : 'Show rooms'),
          isOn: () => showRooms.get(),
          action: () => showRooms.set(!showRooms.get()),
          icon: (options) => (showRooms.get() ? Icons.visible(options) : Icons.hidden(options)),
        }],
      },
    ])

    return viewer
  }

  // Loads a model into the shared viewer, replacing whatever was loaded before,
  // then rebuilds the inspector tree. `source` is a url or a buffer
  // (RequestSource), matching viewer.load().
  const loadModel = async (source: Parameters<ViewerApi['load']>[0], message: string) => {
    setTree(undefined)
    updateSelected(new Set())
    setBimInfo(undefined)
    setLoadError(undefined)

    const viewer = await ensureViewer()
    if (!viewer) return

    // Drop our self-owned room meshes (not tied to any vim, so unload won't).
    clearRoomMeshes(viewer)

    // Unload any previously loaded model so only the new one remains.
    for (const vim of [...viewer.core.vims]) {
      viewer.unload(vim)
    }
    vimRef.current = undefined

    viewer.modal.loading({ progress: -1, mode: 'percent', message })
    try {
      const vim = await viewer.load(source).getVim()
      if (viewerRef.current !== viewer || !vim) return // unmounted mid-load
      vimRef.current = vim

      viewer.framing.frameScene.call()
      setTree(await buildInspectorTree(vim))
    } catch (err) {
      // Surface the real underlying error.
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('Failed to load VIM file:', err)
      setLoadError(errorMessage)
    } finally {
      viewer.modal.loading(undefined)
    }
  }

  // Reads BIM parameters for the given element and groups them for display.
  const loadBimInfo = async (elementIndex: number | undefined) => {
    const token = ++bimToken.current
    const vim = vimRef.current
    const element = elementIndex !== undefined ? vim?.getElementFromIndex(elementIndex) : undefined
    if (!element) { setBimInfo(undefined); return }

    const [bimElement, params] = await Promise.all([element.getBimElement(), element.getBimParameters()])
    if (token !== bimToken.current) return // a newer selection superseded this load

    const groups: BimGroup[] = []
    const byGroup = new Map<string, BimRow[]>()
    for (const p of params) {
      if (!p.name) continue
      const group = p.group && p.group.length > 0 ? p.group : 'Other'
      let rows = byGroup.get(group)
      if (!rows) { rows = []; byGroup.set(group, rows); groups.push({ group, rows }) }
      rows.push({ name: p.name, value: p.value ?? '' })
    }
    const name = bimElement.name && bimElement.name.length > 0 ? bimElement.name : 'Element'
    setBimInfo({ title: `${name} [${bimElement.id ?? elementIndex}]`, groups })
  }

  useEffect(() => {
    loadModel({ url: RESIDENCE_URL }, 'Loading model…')
    return () => {
      unsubRef.current?.()
      if (viewerRef.current) clearRoomMeshes(viewerRef.current)
      viewerRef.current?.dispose()
      viewerRef.current = undefined
    }
  }, [])

  // Read the chosen .vim file from disk and load it as a buffer.
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const buffer = event.target?.result
      if (buffer instanceof ArrayBuffer) loadModel({ buffer }, 'Loading from disk')
    }
    reader.readAsArrayBuffer(file)
    // Clear the value so picking the same file again still fires `change`. We
    // show the name ourselves (below), so the native "No file chosen" label is
    // hidden and never out of sync.
    input.value = ''
  }

  // Removes and disposes the room mesh for the given room element, if shown.
  const removeRoomMesh = (viewer: ViewerApi, roomElement: number) => {
    const mesh = roomMeshesRef.current.get(roomElement)
    if (!mesh) return
    // `add`/`remove` for raw THREE objects exist on the concrete renderer but
    // aren't on the public IWebglRenderer type — cast to reach them.
    ;(viewer.core.renderer as unknown as RawSceneRenderer).remove(mesh)
    mesh.geometry.dispose()
    ;(mesh.material as VIM.THREE.Material).dispose()
    roomMeshesRef.current.delete(roomElement)
  }

  // Removes and disposes every shown room mesh.
  const clearRoomMeshes = (viewer: ViewerApi) => {
    for (const roomElement of [...roomMeshesRef.current.keys()]) {
      removeRoomMesh(viewer, roomElement)
    }
  }

  // Visualizes a room as our own transparent THREE mesh, built from the room's
  // actual geometry and added straight into the render scene. Untracked by the
  // viewer, so its material and visibility are entirely ours to control. No-op
  // if the room is already shown.
  const addRoomMesh = (viewer: ViewerApi, vim: IWebglVim, roomElement: number) => {
    if (roomMeshesRef.current.has(roomElement)) return

    const el = vim.getElementFromIndex(roomElement)
    const geometry = el ? buildRoomGeometry(el) : undefined
    if (!geometry) return

    // Unlit material — the viewer's scene has no THREE lights (it uses custom
    // shaders), so a lit material would render black. depthWrite off + double
    // side gives a clean translucent shell you can see the contents through.
    const material = new VIM.THREE.MeshBasicMaterial({
      color: 0x4aa3ff,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      side: VIM.THREE.DoubleSide,
    })
    const mesh = new VIM.THREE.Mesh(geometry, material)
    // Align with the model: the extracted positions are in vim-local space; the
    // vim's world transform lives on vim.scene.matrix.
    mesh.matrixAutoUpdate = false
    mesh.matrix.copy(vim.scene.matrix)

    ;(viewer.core.renderer as unknown as RawSceneRenderer).add(mesh)
    roomMeshesRef.current.set(roomElement, mesh)
  }

  // Syncs shown room meshes to the selection after a row click. A plain click
  // replaces the selection, so we clear all shells and show the clicked room (if
  // any). A ctrl/cmd-click only flips the clicked room row, matching how the
  // underlying selection toggles — so every selected room row keeps its shell.
  const updateRoomMeshes = (item: TreeItem, toggle: boolean, next: ReadonlySet<number>) => {
    const viewer = viewerRef.current
    const vim = vimRef.current
    if (!viewer || !vim) return

    const roomElement = item.kind === 'group' && item.level === 'Room' ? item.roomElement : undefined

    if (toggle) {
      if (roomElement !== undefined) {
        const stillSelected = item.elements.every((i) => next.has(i))
        if (stillSelected) addRoomMesh(viewer, vim, roomElement)
        else removeRoomMesh(viewer, roomElement)
      }
    } else {
      clearRoomMeshes(viewer)
      if (roomElement !== undefined) addRoomMesh(viewer, vim, roomElement)
    }

    viewer.core.renderer.requestRender()
  }

  // Selects every element under a clicked row. A plain click replaces the
  // selection; ctrl/cmd-click toggles those elements in or out of it. Selecting
  // a Room row also reveals that room's (transparent) volume geometry.
  const onSelect = (item: TreeItem, toggle: boolean) => {
    const viewer = viewerRef.current
    const vim = vimRef.current
    const elements = item.elements
    if (!viewer || !vim || elements.length === 0) return

    const objects = elements
      .map((i) => vim.getElementFromIndex(i))
      .filter((e): e is NonNullable<typeof e> => !!e)
    if (objects.length === 0) return

    const current = selectedRef.current
    const next = new Set(current)

    // Guard the viewer mutation so the resulting onSelectionChanged echo is
    // ignored by our listener. We update the highlight ourselves below.
    applyingSelfRef.current = true
    try {
      if (toggle) {
        const allSelected = elements.every((i) => current.has(i))
        if (allSelected) {
          viewer.core.selection.remove(objects)
          elements.forEach((i) => next.delete(i))
        } else {
          viewer.core.selection.add(objects)
          elements.forEach((i) => next.add(i))
        }
      } else {
        viewer.core.selection.select(objects)
        next.clear()
        elements.forEach((i) => next.add(i))
      }
    } finally {
      applyingSelfRef.current = false
    }

    updateSelected(next)
    loadBimInfo(firstOf(next))

    // Show/hide the transparent shells for selected room rows.
    updateRoomMeshes(item, toggle, next)

    // Re-center the orbit pivot on the centroid of the new selection. setTarget
    // moves only the orbit target, not the camera. getBoundingBox reflects the
    // viewer selection we just mutated; its center is the centroid.
    viewer.core.selection.getBoundingBox().then((box) => {
      if (!box || viewerRef.current !== viewer) return
      const centroid = box.min.clone().add(box.max).multiplyScalar(0.5)
      viewer.core.camera.snap().setTarget(centroid)
    })
  }

  return (
    // Fill the page's content area. The parent is `position: relative`, so
    // absolute inset-0 sizes us reliably (a percentage height would collapse).
    <div style={{ display: 'flex', position: 'absolute', inset: 0 }}>
      {/* Custom inspector pane: header, tree, then BIM info stacked vertically. */}
      <div style={paneStyle}>
        <div style={{ flex: '0 0 auto', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>
          <h3 style={{ margin: '0 0 0.5rem' }}>Project Inspector</h3>
          <input ref={fileInputRef} type="file" accept=".vim" onChange={handleFile} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', cursor: 'pointer' }}>
            Open local .vim
          </button>
          {fileName && (
            <div style={{ marginTop: '0.25rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fileName}>
              {fileName}
            </div>
          )}
        </div>

        <div style={sectionStyle}>
          {loadError && <div style={{ color: '#b00020', whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>Load failed: {loadError}</div>}
          {!tree && !loadError && <div style={{ color: '#888' }}>Loading model…</div>}
          {tree?.map((item, i) => (
            <TreeNode key={i} item={item} depth={0} selected={selected} onSelect={onSelect} />
          ))}
        </div>

        <div style={{ ...sectionStyle, borderTop: '1px solid #ddd' }}>
          <h4 style={{ margin: '0 0 0.5rem' }}>BIM Inspector</h4>
          {bimInfo ? <BimInfoView info={bimInfo} /> : <div style={{ color: '#888' }}>Select an element to inspect.</div>}
        </div>
      </div>

      {/* 3D viewer fills the rest.
          createViewer() forces the element it's given to `position: absolute`
          and adds the `vim-component` class (which sets `inset: 0`), so it
          fills its nearest positioned ancestor. We give it a `flex: 1`,
          `position: relative` wrapper so it fills only this region — not the
          pane. Passing the bare flex item instead would let it cover the pane. */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={viewerDiv} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tree data                                                          */
/* ------------------------------------------------------------------ */

// `elements` holds every BIM element index under a node, so a click can select
// the whole hierarchy. For a leaf it's just its own element.
type Leaf = { kind: 'leaf'; label: string; elements: number[] }
type Group = {
  kind: 'group'; label: string; level: string; count: number
  children: TreeItem[]; elements: number[]
  // For Room-level rows: the element index of the room's own volume geometry
  // (from the room table), so selecting the row can reveal it. Undefined for
  // other levels or rooms with no volume element.
  roomElement?: number
}
type TreeItem = Group | Leaf

/** First value of a set, or undefined when empty. */
function firstOf (set: ReadonlySet<number>): number | undefined {
  return set.values().next().value
}

/** A grouping level: a display name plus how to extract its bucket key from an element. */
type Level = { name: string; key: (e: IElement) => string }

/**
 * Builds a standalone THREE.BufferGeometry from an element's merged geometry, in
 * the vim's local space. Walks each merged submesh's index range
 * (`meshStart..meshEnd`) and copies only the referenced vertices, remapping
 * indices so the result is compact. Returns undefined if the element has no
 * merged geometry (e.g. instanced-only). Reads internal mesh fields by design.
 */
function buildRoomGeometry (element: VIM.Core.Webgl.IElement3D): VIM.THREE.BufferGeometry | undefined {
  const meshes = (element as unknown as { _meshes?: MergedSubmeshLike[] })._meshes
  if (!meshes?.length) return undefined

  const positions: number[] = []
  const indices: number[] = []
  for (const sub of meshes) {
    if (!sub.merged) continue // instanced submeshes aren't handled here
    const geom = sub.three.geometry
    const pos = geom.getAttribute('position')
    const index = geom.index
    if (!pos || !index) continue

    const remap = new Map<number, number>()
    for (let i = sub.meshStart; i < sub.meshEnd; i++) {
      const v = index.getX(i)
      let nv = remap.get(v)
      if (nv === undefined) {
        nv = positions.length / 3
        remap.set(v, nv)
        positions.push(pos.getX(v), pos.getY(v), pos.getZ(v))
      }
      indices.push(nv)
    }
  }
  if (indices.length === 0) return undefined

  const geometry = new VIM.THREE.BufferGeometry()
  geometry.setAttribute('position', new VIM.THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  return geometry
}

/**
 * Reads the BIM tables off the loaded vim and builds the nested tree.
 * Only geometry elements are included so every leaf is selectable in the scene.
 */
async function buildInspectorTree (vim: IWebglVim): Promise<TreeItem[]> {
  const doc = vim.bim
  if (!doc?.element) return []

  const [bimElements, categories, rooms, typeNames] = await Promise.all([
    doc.element.getAll(),
    doc.category?.getAll() ?? Promise.resolve([]),
    doc.room?.getAll() ?? Promise.resolve([]),
    buildFamilyTypeNameMap(doc),
  ])

  // Index BIM tables by their row index for O(1) lookups while grouping.
  const categoryByIndex = new Map(categories.map((c) => [c.index, c]))
  const roomByIndex = new Map(rooms.map((r) => [r.index, r]))

  // Label rooms by their room number; fall back to "<unknown>" when absent.
  const roomLabel = (e: IElement): string => {
    if (e.roomIndex === undefined) return 'No Room'
    return roomByIndex.get(e.roomIndex)?.number ?? '<unknown>'
  }

  const categoryLabel = (e: IElement): string =>
    (e.categoryIndex !== undefined ? categoryByIndex.get(e.categoryIndex)?.name : undefined) ?? 'Uncategorized'

  // Reorder / swap these to change the hierarchy.
  const LEVELS: Level[] = [
    { name: 'Room', key: roomLabel },
    { name: 'Category', key: categoryLabel },
    { name: 'Family', key: (e) => e.familyName ?? '(No Family)' },
    { name: 'Type', key: (e) => typeNames.get(e.index) ?? '(No Type)' },
  ]

  const leafLabel = (e: IElement): string => {
    const name = e.name && e.name.length > 0 ? e.name : 'Element'
    return `${name} [${e.id ?? e.index}]`
  }

  // Restrict to elements that actually have geometry — these are the ones a
  // user can click and see in the scene. `getAllElements()` returns the 3D
  // elements; we group their underlying BIM rows.
  const geometryIndices = new Set(vim.getAllElements().map((e) => e.element))
  const elements = bimElements.filter((e) => geometryIndices.has(e.index))

  const tree = groupElements(elements, LEVELS, 0, leafLabel)

  // The top level is the Room level (LEVELS[0]). Attach each room row's own
  // volume-geometry element (from the room table, keyed by the same label the
  // grouping used) so selecting the row can reveal that volume.
  const roomElementByLabel = new Map<string, number>()
  for (const room of rooms) {
    if (room.elementIndex === undefined) continue
    const label = room.number ?? '<unknown>'
    if (!roomElementByLabel.has(label)) roomElementByLabel.set(label, room.elementIndex)
  }
  for (const node of tree) {
    if (node.kind === 'group') node.roomElement = roomElementByLabel.get(node.label)
  }

  return tree
}

/**
 * Maps each element index to its Revit *type* name (e.g. "Generic - 200mm").
 *
 * An element's type isn't a direct field — it's reached through the family
 * instance → family type → type element chain. This mirrors vim-web's own
 * internal `getFamilyTypeNameMap` helper. Elements that aren't family instances
 * (e.g. system-family walls/floors) won't appear here and fall back to "(No Type)".
 */
async function buildFamilyTypeNameMap (doc: VimDocument): Promise<Map<number, string>> {
  const result = new Map<number, string>()
  const familyInstance = doc.familyInstance
  const familyType = doc.familyType
  const element = doc.element
  if (!familyInstance || !familyType || !element) return result

  const [instanceElement, instanceFamilyType, typeElement, names] = await Promise.all([
    familyInstance.getAllElementIndex(),
    familyInstance.getAllFamilyTypeIndex(),
    familyType.getAllElementIndex(),
    element.getAllName(),
  ])
  if (!instanceElement || !instanceFamilyType || !typeElement || !names) return result

  for (let i = 0; i < instanceElement.length; i++) {
    const ftIndex = instanceFamilyType[i]
    if (ftIndex === undefined || ftIndex < 0) continue
    const typeElementIndex = typeElement[ftIndex]
    if (typeElementIndex === undefined || typeElementIndex < 0) continue
    const name = names[typeElementIndex]
    if (name) result.set(instanceElement[i], name)
  }
  return result
}

/** Recursively groups elements by each level, producing leaves at the bottom. */
function groupElements (elements: IElement[], levels: Level[], depth: number, leafLabel: (e: IElement) => string): TreeItem[] {
  if (depth === levels.length) {
    return elements
      .map((e): Leaf => ({ kind: 'leaf', label: leafLabel(e), elements: [e.index] }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  const { name, key } = levels[depth]
  const buckets = new Map<string, IElement[]>()
  for (const e of elements) {
    const k = key(e)
    const bucket = buckets.get(k)
    if (bucket) bucket.push(e)
    else buckets.set(k, [e])
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, els]): Group => {
      const children = groupElements(els, levels, depth + 1, leafLabel)
      return {
        kind: 'group',
        label,
        level: name,
        count: els.length,
        children,
        elements: children.flatMap((c) => c.elements),
      }
    })
}

/* ------------------------------------------------------------------ */
/* Tree rendering                                                     */
/* ------------------------------------------------------------------ */

const INDENT_PX = 14 // horizontal step per tree level

function TreeNode (props: { item: TreeItem; depth: number; selected: ReadonlySet<number>; onSelect: (item: TreeItem, toggle: boolean) => void }) {
  const { item, depth, selected, onSelect } = props
  const [open, setOpen] = useState(false) // collapsed by default
  const isGroup = item.kind === 'group'

  // A row is selected when every element under it is in the selection.
  const isSelected = item.elements.length > 0 && item.elements.every((i) => selected.has(i))

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: `${depth * INDENT_PX + 4}px`,
    whiteSpace: 'nowrap',
    borderRadius: 3,
    background: isSelected ? '#cde4ff' : undefined,
    fontWeight: isSelected ? 'bold' : undefined,
  }

  // Chevron column toggles expansion only — clicking it never selects (its
  // own handler stops propagation, and selection lives on the sibling region).
  const chevron = (
    <span
      onClick={isGroup ? (e) => { e.stopPropagation(); setOpen((o) => !o) } : undefined}
      style={{
        flexShrink: 0,
        width: '1.4rem',
        textAlign: 'center',
        fontSize: '1.05rem',
        lineHeight: 1,
        color: '#666',
        cursor: isGroup ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {isGroup ? (open ? '▾' : '▸') : ''}
    </span>
  )

  return (
    <div>
      <div style={rowStyle} title={isGroup ? item.level : undefined}>
        {chevron}
        {/* Selection target: everything to the right of the chevron. */}
        <span
          onClick={(e) => onSelect(item, e.ctrlKey || e.metaKey)}
          style={{ flex: 1, cursor: 'pointer', padding: '2px 4px 2px 0' }}
        >
          {isGroup
            ? <>{item.label} <span style={{ color: '#999', fontWeight: 'normal' }}>({item.count})</span></>
            : <>▪ {item.label}</>}
        </span>
      </div>
      {isGroup && open && item.children.map((child, i) => (
        <TreeNode key={i} item={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* BIM Inspector rendering                                            */
/* ------------------------------------------------------------------ */

type BimRow = { name: string; value: string }
type BimGroup = { group: string; rows: BimRow[] }
type BimInfo = { title: string; groups: BimGroup[] }

function BimInfoView (props: { info: BimInfo }) {
  const { info } = props
  return (
    <div>
      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{info.title}</div>
      {info.groups.map((g, i) => (
        <div key={i} style={{ marginBottom: '0.6rem' }}>
          <div style={{ fontWeight: 'bold', color: '#555', borderBottom: '1px solid #eee', marginBottom: '2px' }}>{g.group}</div>
          {g.rows.map((r, j) => (
            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
              <span style={{ color: '#666' }}>{r.name}</span>
              <span style={{ textAlign: 'right', wordBreak: 'break-word' }}>{r.value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */

const paneStyle: React.CSSProperties = {
  width: '320px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid #ccc',
  background: '#fff',
  fontFamily: "'Roboto', sans-serif",
  fontSize: '13px',
  lineHeight: '1.4rem',
}

// Each scrollable section takes half the remaining height. `minHeight: 0` is
// required for an `overflow: auto` child of a flex column to actually scroll.
const sectionStyle: React.CSSProperties = {
  flex: '1 1 50%',
  minHeight: 0,
  overflow: 'auto',
  padding: '0.5rem 0.75rem',
}
