import { RefObject, useEffect, useRef, ChangeEvent } from 'react'
import { createRoot } from 'react-dom/client'
import * as VIM from './vim-web'
// DS-port spike: the real settings builder feeds the DS settings panel (shared GenericCommonEntry type).
import { getIsolationSettings } from './vim-web/react-viewers/settings/settingsPanelContent'

type ViewerRef = VIM.React.Webgl.ViewerApi | VIM.React.Ultra.ViewerApi

function isWebglViewer (viewer: ViewerRef): viewer is VIM.React.Webgl.ViewerApi {
  return viewer.type === 'webgl'
}

// Vite HMR re-executes this module; reuse the root instead of creating a second one (React warns).
const container = document.getElementById('root')!
const root = ((globalThis as any).__vimRoot ??= createRoot(container))

root.render(<App />)

function App() {
  const div = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<ViewerRef>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dsSpike = useRef<HTMLDivElement>(null)
  const dsBar = useRef<HTMLDivElement>(null)
  const dsGrid = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = div.current!
    if (window.location.pathname.includes('ultra')) {
      createUltra(viewerRef, el)
    } else {
      createWebgl(viewerRef, el)
    }

    const handleBeforeUnload = () => viewerRef.current?.dispose()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      viewerRef.current?.dispose()
    }
  }, [])

  // DS-port spike: mount the React-free DS atoms beside the viewer to prove the toolchain end to end.
  // The icon button's `on` is bound to the checkbox's state, so toggling one updates the other.
  useEffect(() => {
    const host = dsSpike.current!
    const checked = VIM.React.createState(false)
    const text = VIM.React.createState('hello')
    const choice = VIM.React.createState('b')
    const c = VIM.Dom.Components
    const tips = c.tooltipZone(host)
    const cb = c.checkbox(host, { label: 'DS checkbox', state: checked })
    const btn = c.iconButton(host, {
      icon: '★',
      on: checked,
      tip: 'Bound to the checkbox',
      onClick: () => checked.set(!checked.get())
    })
    const inp = c.input(host, { state: text, placeholder: 'DS input' })
    const sel = c.select(host, {
      state: choice,
      options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }]
    })
    // Control bar: pointer-mode buttons whose active state follows `mode`; the bar re-syncs on change.
    const I = VIM.Dom.Icons
    const mode = VIM.React.createState('orbit')
    const showPanel = VIM.React.createState(false)
    const dsModal = VIM.Dom.Modal.modal()
    Object.assign(globalThis, { dsModal })
    const modeButton = (id: string, icon: VIM.Dom.Icons.IconFactory, tip: string) => ({
      id, tip, icon, isOn: () => mode.get() === id, action: () => mode.set(id)
    })
    const bar = VIM.Dom.ControlBar.controlBar(dsBar.current!, [
      { id: 'pointer', buttons: [modeButton('orbit', I.orbit, 'Orbit'), modeButton('pan', I.pan, 'Pan'), modeButton('zoom', I.zoom, 'Zoom')] },
      {
        id: 'misc', variant: 'blue', buttons: [
          { id: 'settings', tip: 'Settings', icon: I.settings, isOn: () => showPanel.get(), action: () => showPanel.set(!showPanel.get()) },
          { id: 'help', tip: 'Help', icon: I.help, action: () => dsModal.help(true) },
          {
            id: 'message', tip: 'Message demo', icon: I.more,
            action: () => dsModal.message({ title: 'DS Message', body: 'A message box on the DS modal.', footer: 'Footer', canClose: true, minimize: true })
          },
          {
            id: 'loading', tip: 'Loading demo (2.5 s)', icon: I.frameScene,
            action: () => {
              dsModal.loading({ message: 'Loading in DS Mode', progress: 42, mode: 'percent', more: VIM.Dom.Modal.ultraSuggestion() })
              setTimeout(() => dsModal.loading(undefined), 2500)
            }
          },
          {
            id: 'error', tip: 'Error demo', icon: I.trash,
            action: () => dsModal.message(VIM.Dom.Errors.webglFileError('https://example.com/model.vim', 'HTTP 404 Not Found'))
          }
        ]
      }
    ])
    const barTips = c.tooltipZone(dsBar.current!)
    // Icon grid: every icon rendered once by the DOM renderer.
    const grid = dsGrid.current!
    for (const [name, make] of Object.entries(I)) {
      if (typeof make !== 'function') continue
      const svg = make({ width: 16, height: 16 })
      svg.setAttribute(c.TIP_ATTR, name)
      grid.appendChild(svg)
    }
    const gridTips = c.tooltipZone(grid)
    // Generic panel: a settings popover floating above the DS control bar, with a dependent enabled() row.
    const g = {
      ghost: VIM.React.createState(true),
      ghostOpacity: VIM.React.createState(0.25),
      quality: VIM.React.createState('medium'),
      name: VIM.React.createState('Residence')
    }
    const panel = VIM.Dom.Generic.genericPanel(host, {
      title: 'DS Render Settings',
      show: showPanel,
      anchor: () => bar.el,
      entries: [
        { type: 'group', id: 'ghosting', label: 'Ghosting' },
        { type: 'bool', id: 'ghost', label: 'Show Ghost', state: g.ghost },
        { type: 'number', id: 'ghostOpacity', label: 'Ghost Opacity', state: g.ghostOpacity, min: 0, max: 1, step: 0.05, enabled: () => g.ghost.get() },
        { type: 'section', id: 'outline', label: 'Outline' },
        { type: 'select', id: 'quality', label: 'Outline Quality', state: g.quality, options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }] },
        { type: 'text', id: 'name', label: 'Name', state: g.name },
        { type: 'readonly', id: 'count', label: 'Elements', value: '42,000' }
      ]
    })
    const unsubs = [
      showPanel.onChange.subscribe(() => bar.update()),
      g.ghostOpacity.onChange.subscribe(v => console.log('DS ghost opacity:', v)),
      checked.onChange.subscribe(v => console.log('DS checkbox:', v)),
      text.onChange.subscribe(v => console.log('DS input:', v)),
      choice.onChange.subscribe(v => console.log('DS select:', v)),
      mode.onChange.subscribe(m => {
        console.log('DS mode:', m)
        bar.update()
      })
    ]
    return () => {
      for (const u of unsubs) u()
      for (const h of [panel, sel, inp, btn, cb, tips, bar, barTips, gridTips, dsModal]) h.destroy()
      grid.replaceChildren()
    }
  }, [])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !viewerRef.current) return
    if (!isWebglViewer(viewerRef.current)) return

    const viewer = viewerRef.current
    for (const vim of [...viewer.core.vims]) {
      viewer.unload(vim)
    }
    const request = viewer.load({ buffer: await file.arrayBuffer() }, { prewarmBim: true })
    const result = await request.getResult()
    if (result.isError) {
      console.error('Load failed:', result.error)
      return
    }
    viewer.framing.frameScene.call()
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".vim"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 100, padding: '8px 16px' }}
      >
        Open Local File
      </button>
      <div
        ref={dsSpike}
        className="ds-root"
        style={{
          position: 'absolute', left: 10, bottom: 60, zIndex: 100, width: 200, padding: 8,
          display: 'flex', flexDirection: 'column', gap: 6
        }}
      />
      <div
        ref={dsBar}
        className="ds-root"
        style={{ position: 'absolute', left: 10, top: 70, width: 360, height: 56, zIndex: 100 }}
      />
      <div
        ref={dsGrid}
        className="ds-root"
        style={{
          position: 'absolute', left: 10, top: 140, width: 360, zIndex: 100, padding: 8,
          display: 'flex', flexWrap: 'wrap', gap: 6, color: 'var(--text-200)', background: 'var(--stage-900)'
        }}
      />
      <div
        id="ds-axes-host"
        className="ds-root"
        style={{ position: 'absolute', left: 380, top: 70, width: 136, height: 136, zIndex: 100 }}
      />
      <div
        id="ds-settings-host"
        className="ds-root"
        style={{ position: 'absolute', left: 530, top: 70, width: 300, height: 320, zIndex: 100 }}
      />
      <div ref={div} style={{ position: 'absolute', inset: 0 }}/>
    </>
  )
}

async function createWebgl (viewerRef: RefObject<ViewerRef>, div: HTMLDivElement) {
  const viewer = await VIM.React.Webgl.createViewer(div)
  viewerRef.current = viewer
  globalThis.viewer = viewer
  // DS-port spike: the DS speed toast beside the React one (change speed with +/- to see both).
  Object.assign(globalThis, { dsSpeedToast: VIM.Dom.Panels.speedToast(viewer.core) })
  // DS-port spike: axes panel (it adopts the gizmo canvas, so the React axes panel goes empty) and
  // context menu (it also listens to the core, so a right-click opens both menus while spiking).
  const dsModal = (globalThis as any).dsModal as VIM.Dom.Modal.ModalApi
  Object.assign(globalThis, {
    dsAxes: VIM.Dom.Panels.axesPanel(document.getElementById('ds-axes-host')!, {
      viewer: viewer.core,
      framing: viewer.framing,
      settings: { panelAxes: true, axesOrthographic: true, axesHome: true }
    }),
    dsContextMenu: VIM.Dom.Panels.contextMenu({
      viewer: viewer.core, framing: viewer.framing, modal: dsModal, isolation: viewer.isolation
    }),
    dsSettings: VIM.Dom.Settings.settingsPanel(document.getElementById('ds-settings-host')!, {
      entries: getIsolationSettings(viewer.isolation, viewer.renderSettings)
    })
  })

  const url = getPathFromUrl() ?? 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'
  const request = viewer.load({ url }, { prewarmBim: true })
  await request.getVim()
  viewer.framing.frameScene.call()
}

async function createUltra (viewerRef: RefObject<ViewerRef>, div: HTMLDivElement) {
  const viewer = await VIM.React.Ultra.createViewer(div)
  await viewer.core.connect()
  viewerRef.current = viewer
  globalThis.viewer = viewer

  const url = getPathFromUrl() ?? 'https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim'
  const request = viewer.load({ url })

  const result = await request.getResult()
  if (result.isError) {
    console.error('Load failed:', result.type, result.error)
    return
  }
  viewer.framing.frameScene.call()
}

function getPathFromUrl () {
  const params = new URLSearchParams(window.location.search)
  return params.get('vim') ?? undefined
}
