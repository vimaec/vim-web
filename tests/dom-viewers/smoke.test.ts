// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import * as VIM from '../../src/vim-web'
// The chrome is no longer part of the public surface — the viewer roots build it, and a host
// reaches it through `viewer.controlBar`, `viewer.topBar`, `viewer.views` and `viewer.modal`. The
// tests below still drive the real widgets, so they come from their own modules.
import { controlBar, type ControlBarSection } from '../../src/vim-web/dom-viewers/controlbar/controlBar'
import { topBar } from '../../src/vim-web/dom-viewers/topbar/topBar'
import { viewPanel } from '../../src/vim-web/dom-viewers/viewpanel/viewPanel'
import { modal } from '../../src/vim-web/dom-viewers/modal/modal'
import { bimRows } from '../../src/vim-web/dom-viewers/bim/bimRows'
import { bimGrouping } from '../../src/vim-web/dom-viewers/bim/bimGrouping'

/**
 * What a headless run can say about the viewer.
 *
 * Neither root can be constructed here: `Webgl.createViewer` wants a WebGL 2 context and Ultra's
 * stream decoder wants `OffscreenCanvas.getContext`, and happy-dom has neither. Faking a GPU would
 * only test the fake. So this covers the two things that break without one: that the public module
 * graph still loads and exports what the package promises, and that the chrome around the canvas
 * builds, responds and tears itself down leaving nothing behind.
 */

const hosts: HTMLElement[] = []

/** A `.ds-root` host, which is what the viewer roots give every DS component. */
function host (): HTMLElement {
  const el = document.createElement('div')
  el.className = 'ds-root'
  document.body.appendChild(el)
  hosts.push(el)
  return el
}

afterEach(() => {
  for (const el of hosts.splice(0)) el.remove()
  document.body.replaceChildren()
})

describe('the public module graph', () => {
  it('exports the namespaces the package documents', () => {
    // `Core.*.Viewer` is a type, so the runtime check is on what actually builds one.
    expect(typeof VIM.Core.Webgl.createViewer).toBe('function')
    expect(typeof VIM.Core.Webgl.isElement3D).toBe('function')
    expect(typeof VIM.Core.Ultra.createViewer).toBe('function')
    expect(VIM.Core.Ultra.VisibilityState.GHOSTED).toBe(2)
    expect(typeof VIM.Dom.Webgl.createViewer).toBe('function')
    expect(typeof VIM.Dom.Ultra.createViewer).toBe('function')
    expect(typeof VIM.THREE.Vector3).toBe('function')
  })

  it('exports the observables the customization API is written in', () => {
    const flag = VIM.Dom.createState(false)
    const seen: boolean[] = []
    const unsubscribe = flag.onChange.subscribe(v => seen.push(v))
    flag.set(true)
    unsubscribe()
    flag.set(false)
    expect(seen).toEqual([true])
    expect(flag.get()).toBe(false)

    let ran = 0
    const action = VIM.Dom.createFuncRef(() => { ran++ })
    action.update(prev => () => { prev(); ran += 10 })
    action.call()
    expect(ran).toBe(11)
  })

  it('exports the namespaces and nothing else, so widening the surface is deliberate', () => {
    expect(Object.keys(VIM.Dom).sort()).toEqual([
      'Bim', 'Components', 'ControlBar', 'Errors', 'Generic', 'Icons', 'Modal', 'Panels',
      'Settings', 'State', 'TopBar', 'Ultra', 'ViewPanel', 'Webgl',
      'childScope', 'createContainer', 'createFuncRef', 'createState', 'getElements'
    ].sort())

    // The chrome namespaces carry types and ids, not the factories that build our own chrome.
    expect(Object.keys(VIM.Dom.ControlBar)).toEqual(['controlBarIds'])
    expect(Object.keys(VIM.Dom.TopBar)).toEqual(['topBarIds'])
    expect(Object.keys(VIM.Dom.Panels)).toEqual(['contextMenuIds'])
    expect(Object.keys(VIM.Dom.ViewPanel)).toEqual([])
    expect(Object.keys(VIM.Dom.Modal)).toEqual([])
    expect(Object.keys(VIM.Dom.State)).toEqual(['createSettingState'])
    expect(Object.keys(VIM.Dom.Bim).sort()).toEqual([
      'BimTreeData', 'DEFAULT_GROUPING', 'PARAMETERS_VIEW', 'bimTree', 'parametersView', 'toTreeData'
    ].sort())
    expect(Object.keys(VIM.Dom.Settings).sort()).toEqual([
      'SETTINGS_VIEW', 'isFalse', 'isTrue', 'settingsIds'
    ].sort())
    // vim-powerbi-visual writes its own error screens with these, so they are an extension point.
    expect(Object.keys(VIM.Dom.Errors)).toContain('style')
    expect(typeof VIM.Dom.Errors.style.numList).toBe('function')
  })

  it('builds icons as detached SVG, so a factory can be handed straight to a button', () => {
    const icon = VIM.Dom.Icons.home()
    expect(icon.tagName.toLowerCase()).toBe('svg')
    expect(icon.isConnected).toBe(false)
  })
})

describe('the container', () => {
  it('wraps an element in the canvas and UI mounts, and hands it back on dispose', () => {
    const el = host()
    const container = VIM.Dom.createContainer(el)

    expect(container.root).toBe(el)
    expect(container.gfx.parentElement).toBe(el)
    expect(container.ui.parentElement).toBe(el)

    container.dispose()
    expect(el.children).toHaveLength(0)
    expect(el.classList.contains('vim-component')).toBe(false)
  })
})

describe('the control bar', () => {
  const sections = (on: () => boolean, action: () => void): ControlBarSection[] => [{
    id: 'tools',
    buttons: [
      { id: 'measure', tip: 'Measure', icon: VIM.Dom.Icons.home, isOn: on, action },
      { id: 'hidden', tip: 'Not yet', icon: VIM.Dom.Icons.home, enabled: () => false, action: () => {} }
    ]
  }]

  it('draws the enabled buttons, fires them, and re-reads state on update', () => {
    let lit = false
    let fired = 0
    const bar = controlBar(host(), sections(() => lit, () => { fired++ }))

    const buttons = () => [...bar.el.querySelectorAll<HTMLElement>('.ds-iconbtn')]
    expect(buttons()).toHaveLength(1)

    // Verbs fire on mousedown, so a rapid second press is not swallowed as half a double click.
    buttons()[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(fired).toBe(1)

    lit = true
    bar.update()
    expect(buttons()[0].classList.contains('ds-active')).toBe(true)

    bar.destroy()
  })

  it('shows what a customization returns, not the base definition', () => {
    const bar = controlBar(host(), sections(() => false, () => {}))
    bar.customize(base => [
      ...base,
      { id: 'mine', buttons: [{ id: 'extra', tip: 'Extra', icon: VIM.Dom.Icons.home, action: () => {} }] }
    ])

    expect(bar.el.querySelectorAll('.ds-iconbtn')).toHaveLength(2)
    bar.destroy()
  })
})

describe('the top bar', () => {
  it('opens a menu, runs an item, and carries the title', () => {
    let ran = 0
    const bar = topBar(host(), {
      content: {
        menus: [{
          id: 'view',
          label: 'View',
          items: [{ id: 'panel', label: 'Project Inspector', action: () => { ran++ } }]
        }],
        actions: [{ id: 'full', tip: 'Full screen', icon: VIM.Dom.Icons.home, action: () => {} }]
      }
    })

    const trigger = bar.el.querySelector<HTMLElement>('.ds-menubtn, .ds-topbar__menu, button')!
    trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    trigger.click()

    const item = [...document.querySelectorAll<HTMLElement>('.ds-menu__item')]
      .find(i => i.textContent?.includes('Project Inspector'))
    expect(item).toBeTruthy()
    item!.click()
    expect(ran).toBe(1)

    bar.setTitle('tower.vim')
    expect(bar.el.textContent).toContain('tower.vim')

    bar.destroy()
    expect(document.querySelector('.ds-menu')).toBeNull()
  })
})

describe('the view panel', () => {
  it('builds a view on first open and destroys it on close', () => {
    const el = host()
    const container = VIM.Dom.createContainer(el)
    let built = 0
    let destroyed = 0

    const panel = viewPanel(container.ui, {
      root: container.root,
      gfx: container.gfx,
      resize: () => {}
    })

    panel.register('params', () => ({
      title: 'Parameters',
      mount: body => { built++; body.appendChild(document.createElement('p')) },
      destroy: () => { destroyed++ }
    }))
    expect(built).toBe(0)
    expect(panel.opened()).toEqual([])

    panel.open('params')
    expect(built).toBe(1)
    expect(panel.isOpen('params')).toBe(true)
    expect(panel.el.textContent).toContain('Parameters')

    // Opening again selects the existing tab rather than rebuilding it.
    panel.open('params')
    expect(built).toBe(1)

    panel.close('params')
    expect(destroyed).toBe(1)
    expect(panel.opened()).toEqual([])

    panel.destroy()
    container.dispose()
  })
})

describe('the modal', () => {
  it('shows the highest-priority slot and leaves the body clean when destroyed', async () => {
    const dialog = modal()
    const drawn = () => Promise.resolve()

    // A download of unknown length names the file and counts bytes; there is no bar to draw.
    dialog.loading({ source: 'tower.vim', progress: 4_000_000, mode: 'bytes' })
    await drawn()
    expect(dialog.getActiveState()?.type).toBe('loading')
    expect(document.body.textContent).toContain('tower.vim')
    expect(document.body.textContent).toContain('4.00 MB')
    expect(document.querySelector('.ds-bar')).toBeNull()

    // A message outranks a load in progress, as the React modal did.
    dialog.message({ title: 'Could not open', body: 'The file is not a VIM.' })
    await drawn()
    expect(dialog.getActiveState()?.type).toBe('message')

    dialog.destroy()
    await drawn()
    expect(document.querySelector('.ds-modal')).toBeNull()
  })
})

describe('the inspector chrome', () => {
  it('steps the depth within its bounds', () => {
    const depth = VIM.Dom.createState(0)
    const rows = bimRows(host(), { depth, max: () => 2 })
    const [out, into] = [...rows.el.querySelectorAll<HTMLElement>('.ds-iconbtn')]

    into.click()
    into.click()
    into.click()           // past the deepest level, which the stepper refuses
    expect(depth.get()).toBe(2)

    out.click()
    expect(depth.get()).toBe(1)

    rows.destroy()
    expect(rows.el.isConnected).toBe(false)
  })

  it('writes the nesting from the grouping strip', () => {
    const grouping = VIM.Dom.createState([...VIM.Dom.Bim.DEFAULT_GROUPING])

    const widget = bimGrouping(host(), {
      grouping,
      tierTags: VIM.Dom.createState(true),
      elements: VIM.Dom.createState([])
    })

    // One pill per level, in the order the tree nests them.
    const pills = () => [...widget.el.querySelectorAll<HTMLElement>('.vim-ds-gb__pill')]
    expect(pills()).toHaveLength(grouping.get().length)
    expect(pills()[0].textContent).toContain('1')

    // The strip follows the state, whoever wrote it — a preset, or the drawer's own gestures.
    grouping.set(['Category'])
    expect(pills()).toHaveLength(1)

    widget.destroy()
    expect(widget.el.isConnected).toBe(false)
  })
})
