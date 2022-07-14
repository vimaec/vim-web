
// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react'
import logo from './assets/logo.png'
import iconOrbit from './assets/icon_orbit.png'
import iconFirstPerson from './assets/icon_firstperson.png'
// import iconOrbitSvg from './assets/icon-orbit.svg'
import iconOrtho from './assets/icon_ortho.png'
import iconPerspective from './assets/icon_perspective.jpg'
import iconFocus from './assets/icon_focus.png'
import iconHome from './assets/icon_home.png'
import iconHide from './assets/icon_hide.png'
import iconShowAll from './assets/icon_showall.jpg'
import iconSection from './assets/icon_cube.png'
import iconSectionClipOn from './assets/icon_cut.png'
import iconSectionClipOff from './assets/icon_lemon.png'
import iconIsolate from './assets/icon_ghost.png'
import iconIsolateClear from './assets/icon_ghostbuster.png'
import iconIsolateFamily from './assets/icon_ghostfamily.png'

import * as VIM from 'vim-webgl-viewer/'
import './style.css'

type Progress = 'processing'| number | string
type Table = [string, string][]
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

const IconOrbit = ({ height, width, fill }) => (
  <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <path fill={fill} d="M128 156c-15.44 0-28-12.561-28-28s12.56-28 28-28 28 12.561 28 28-12.56 28-28 28Z" />
    <path fill={fill} d="M128 256c-24.647 0-47.276-25.88-59.058-67.54l-.31-1.093-1.093-.309C25.88 175.276 0 152.646 0 128c0-11.335 5.58-22.567 16.139-32.481l3.217-3.021-4.387-.48c-5.26-.575-9.143-5.205-8.658-10.322a9.42 9.42 0 0 1 9.407-8.569c.302 0 .605.014.911.044l25.583 2.435c6.773.644 11.759 6.679 11.114 13.452l-2.435 25.58a9.418 9.418 0 0 1-9.407 8.57c-.301 0-.605-.014-.911-.044-6.104-.581-8.363-5.811-8.442-10.112l-.089-4.817-3.388 3.427c-5.454 5.518-8.337 11.168-8.337 16.339 0 9.505 9.803 20.387 26.221 29.11 4.201 2.232 8.904 4.335 13.977 6.252l3.209 1.212-.479-3.397c-1.522-10.791-2.294-21.953-2.294-33.178C60.952 57.421 91.03 0 128 0c24.647 0 47.276 25.88 59.058 67.54l.31 1.093 1.093.309c41.66 11.782 67.54 34.412 67.54 59.058 0 36.97-57.421 67.048-128 67.048-11.228 0-22.39-.772-33.178-2.294l-3.397-.479 1.212 3.209c1.918 5.075 4.022 9.777 6.252 13.977 8.723 16.419 19.605 26.221 29.11 26.221 4.96 0 10.383-2.663 15.684-7.7l3.616-3.437-4.988-.067c-4.781-.064-8.743-3.443-9.422-8.036-.761-5.163 2.82-9.983 7.983-10.744l25.423-3.748a12.457 12.457 0 0 1 1.816-.133c6.064 0 11.305 4.532 12.19 10.541l3.747 25.422c.761 5.163-2.819 9.984-7.982 10.745-.502.074-1.003.112-1.487.112-5.382 0-8.592-4.561-9.385-9.08l-.723-4.122-2.792 3.118c-10.22 11.415-21.867 17.448-33.681 17.448Zm0-174.73c-14.083 0-27.933 1.331-41.162 3.955l-1.332.264-.265 1.333C82.606 100.093 81.27 113.947 81.27 128s1.335 27.898 3.969 41.164l.265 1.332 1.332.265c13.269 2.633 27.118 3.969 41.164 3.969s27.911-1.337 41.184-3.973l1.332-.264.265-1.333c2.621-13.209 3.949-27.058 3.949-41.16s-1.335-27.898-3.969-41.164l-.265-1.332-1.332-.265C155.895 82.606 142.046 81.27 128 81.27Zm64.754 13.553c1.522 10.791 2.294 21.953 2.294 33.178s-.777 22.337-2.308 33.182l-.479 3.397 3.209-1.212c5.081-1.92 9.788-4.025 13.991-6.257 16.419-8.723 26.221-19.605 26.221-29.11s-9.803-20.387-26.221-29.11c-4.201-2.232-8.904-4.335-13.977-6.252l-3.209-1.212.479 3.397ZM128 20.317c-9.505 0-20.387 9.803-29.11 26.221-2.231 4.201-4.335 8.906-6.255 13.984l-1.212 3.209 3.397-.479c10.819-1.527 21.983-2.301 33.181-2.301s22.39.772 33.178 2.294l3.397.479-1.212-3.209c-1.918-5.075-4.022-9.777-6.252-13.977-8.723-16.419-19.605-26.221-29.11-26.221Z" />
  </svg>
);
const IconPerspective = ({ height, width, fill }) => (
  <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <path fill={fill} d="m228.729 46.855-188-37.961a34.146 34.146 0 0 0-6.75-.676C15.243 8.218 0 23.471 0 42.221v171.558c0 18.75 15.243 34.003 33.979 34.003 2.258 0 4.529-.227 6.75-.676l188-37.962c15.802-3.19 27.271-17.207 27.271-33.327V80.183c0-16.121-11.469-30.137-27.271-33.327ZM154 56.25v143.5l-52 10.5V45.75l52 10.5ZM35.979 223.581c-.674.136-1.343.201-2 .201-5.384 0-9.979-4.373-9.979-10.003V42.221c0-5.63 4.596-10.003 9.979-10.003.657 0 1.326.065 2 .201L78 40.904v174.192l-42.021 8.485ZM232 175.817a10 10 0 0 1-8.021 9.802L178 194.903V61.096l45.979 9.284A10 10 0 0 1 232 80.182v95.635Z"/>
  </svg>
);

export function createContainer(viewer: VIM.Viewer){
  const root = document.createElement('div')
  root.className = 'vim-component'
  root.style.height = '100%'
  document.body.append(root)

  root.append(viewer.viewport.canvas)

  const ui = document.createElement('div')
  ui.className = 'vim-ui'
  ui.style.height = '100%'
  root.append(ui)

  return ui
}

export function VimComponent (props: {
  viewer: VIM.Viewer,
  onMount: () => void,
  logo?: boolean,
  inspector?: boolean,
  menu?: boolean,
  loading?: boolean
}) {
  const useLogo = props.logo === undefined ? true: props.logo
  const useInspector = props.inspector === undefined ? true: props.inspector
  const useMenu = props.menu === undefined ? true: props.menu
  const useLoading = props.loading === undefined ? true: props.loading
  
  const [section, setSection] = useState(false)

  useEffect(() => {
    props.onMount()
  }, [])

  return (
    <>
      {useLogo ? <Logo /> : null}
      {useLoading ? <LoadingBox viewer={props.viewer}/> : null}
      {useInspector ? <Inspector viewer={props.viewer}/> : null}
      {useMenu ? <Menu viewer={props.viewer} section={section} setSection={setSection}/> : null}
    </>
  )
}

function Menu(props: {viewer: VIM.Viewer, section: boolean, setSection: (value: boolean)=> void}){
  console.log('render menu')

  const viewer = props.viewer
  const [orbit, setObit] = linkState(viewer.camera, 'orbitMode')
  const [ortho, setOrtho] = linkState(viewer.camera, 'orthographic')
  const [selection, setSelection] = useState<VIM.Object>(viewer.selection.object)
  const [section, setSection] = useState(false)
  const [sectionActive, setSectionActive] = useState(viewer.gizmoSection.clip)
  const [sectionShow, setSectionShow] = useState(viewer.gizmoSection.visible)
  
  useEffect(() => {
  // Patch Selection Select
    const prevSelect = viewer.selection.select.bind(viewer.selection)
    viewer.selection.select = (obj) => {
      prevSelect(obj)
      setSelection(obj)
    }

    // Patch Selection Clear
    const prevClear = viewer.selection.clear.bind(viewer.selection)
    viewer.selection.clear = () => {
      prevClear()
      setSelection(undefined)
    }
    viewer.gizmoSection.clip = true
    setSectionActive(true)
  },[])

  const btnOrbit = <button onClick={() => setObit(!orbit)} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 ${orbit ? 'bg-primary-royal' : ''}`} type="button"><IconOrbit height="32" width="32" fill="currentColor" /></button>
  const btnOrtho = <button onClick={() => setOrtho(!ortho)} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 ${ortho ? 'bg-primary-royal' : ''}`} type="button"><IconPerspective height="32" width="32" fill="currentColor" /></button>
  // const btnOrtho = <button className="iconButton" type="button"> <img src={ortho ? iconPerspective : iconOrtho} onClick={() => setOrtho(!ortho)} /></button>

  const onFocusButton = function () {
    if(!selection) return
    viewer.camera.frame(selection, true, viewer.camera.defaultLerpDuration)
  }

  const btnFocus = <button  className="iconButton" type="button" disabled={!selection}><img src={iconFocus} onClick={onFocusButton} /></button>
  iconHome
  const onHomeButton = function(){
    viewer.camera.frame('all', true, viewer.camera.defaultLerpDuration)
  }
  const btnHome = <button className="iconButton"  type="button"><img src={iconHome} onClick={onHomeButton} /></button>

  const onHideButton = function(){
    if(!selection) return
    selection.visible = false
    viewer.selection.clear()
  }
  const btnHide = <button className="iconButton" type="button" disabled={!selection}><img src={iconHide} onClick={onHideButton} /></button>

  const onShowAllButton = function(){
    for(const o of viewer.vims[0].getAllObjects()){
      o.visible = true
    }
  }

  const btnShowAll = <button  className="iconButton" type="button"><img src={iconShowAll} onClick={onShowAllButton} /></button>
  
  const onSectionButton = function (){
    viewer.gizmoSection.interactive = !section
    viewer.gizmoSection.visible = !section
    setSection(!section)
  }

  const btnSection = <button  className="iconButton" type="button"><img src={iconSection} onClick={onSectionButton} /></button>

  const onActivateSectionButton = function (){
    viewer.gizmoSection.clip = !sectionActive
    setSectionActive(!sectionActive)
  }

  console.log('btnSectionActive:' + sectionActive)
  const btnSectionActive = <button className="iconButton" type="button"><img src={sectionActive ? iconSectionClipOn : iconSectionClipOff} onClick={onActivateSectionButton} /></button>
  const empty = <span className='empty'></span>
  const rowSection = section
    ? <div>{empty} {btnSectionActive}{btnSection}</div>
    : <div>{empty}{empty}{btnSection}</div>

  const onIsolateBtn =  function(){
    for (const obj of viewer.selection.object.vim.getAllObjects()) {
      obj.visible = false
    }

    viewer.environment.groundPlane.visible = false
    viewer.selection.object.vim.scene.material = VIM.Materials.getDefaultLibrary().isolation
    viewer.selection.object.visible = true
    viewer.selection.object.color = new VIM.THREE.Color(0,0.75, 1)
  }

  const onIsolateClearBtn =  function(){
    for (const obj of viewer.vims[0].getAllObjects()) {
      obj.visible = true
      obj.color = undefined
    }
    viewer.environment.groundPlane.visible = viewer.settings.getGroundPlaneVisible()
    viewer.selection.object.vim.scene.material = undefined
  }

  const onIsolateFamilyBtn = async function(){
    const ref = await viewer.selection.object
    .getBimElementValue('string:FamilyName', false)
    
    const p: Promise<void>[] = []
    const objs = viewer.selection.object.vim.getAllObjects()
    viewer.environment.groundPlane.visible = false
    viewer.selection.object.vim.scene.material = VIM.Materials.getDefaultLibrary().isolation
    const result: VIM.Object[] = []
    for (const obj of objs) {
      p.push(
        obj
          .getBimElementValue('string:FamilyName', false)
          .then((value) => {
              obj.visible = value === ref
              obj.color = value === ref ? new VIM.THREE.Color(0,0.75, 1) : undefined

          })
      )
    }

    await Promise.all(p)
  }
  const btnIsolate = <button className="iconButton" type="button"><img src={iconIsolate} onClick={onIsolateBtn} /></button>
  const btnIsolateClear = <button className="iconButton" type="button"><img src={iconIsolateClear} onClick={onIsolateClearBtn} /></button>
  const btnIsolateFamily = <button className="iconButton" type="button"><img src={iconIsolateFamily} onClick={onIsolateFamilyBtn} /></button>

   
  return <div className="vim-menu flex mx-6 my-8 fixed right-8 bottom-8">
    <div className='mx-1'>*{empty}*{empty}*{btnOrbit}</div>
    <div className='mx-1'>*{empty}*{empty}*{btnOrtho}</div>
    <div className='mx-1'>*{empty}*{empty}*{btnFocus}</div>
    <div className='mx-1'>{empty}{empty}{btnHome}</div>
    <div className='mx-1'>{empty}{empty}{btnHide}</div>
    <div className='mx-1'>{empty}{empty}{btnShowAll}</div>
    <div className='mx-1'>{rowSection}</div>
    <div className='mx-1'>{btnIsolateFamily}{btnIsolate}{btnIsolateClear}  </div>
  </div>

  // return <div className="vim-menu">
  //   <table>
  //     <tbody>
  //     <tr>{empty}{empty}<td>{btnOrbit}</td></tr>
  //     <tr>{empty}{empty}<td>{btnOrtho}</td></tr>
  //     <tr>{empty}{empty}<td>{btnFocus}</td></tr>
  //     <tr>{empty}{empty}<td>{btnHome}</td></tr>
  //     <tr>{empty}{empty}<td>{btnHide}</td></tr>
  //     <tr>{empty}{empty}<td>{btnShowAll}</td></tr>
  //     {rowSection}
  //     <tr><td>{btnIsolateFamily}</td><td>{btnIsolate}</td><td>{btnIsolateClear}</td></tr>
  //     </tbody>
  //   </table>
  // </div>
}
/*
function Section(){

 
    return <div className="vim-section">
    <table>
      <tbody>
        <tr>
          <td>{btnShow}</td>
          <td>{btnActive}</td>
        </tr>
      </tbody>
    </table>
  </div>
}
*/

function Logo () {
  console.log('Logo')
  return (
    <div className="vim-logo">
      <a href="https://vimaec.com">
        <img src={logo}></img>
      </a>
    </div>
  )
}

function LoadingBox (props: { viewer: VIM.Viewer }) {
  console.log('LoadingBox')
  const [progress, setProgress] = useState<Progress>()

  // Patch load
  useEffect(() => {
    const prevLoad = props.viewer.loadVim.bind(props.viewer)
    props.viewer.loadVim = function (source: string| ArrayBuffer, options: VIM.VimOptions.Root, _ : (logger: VIM.IProgressLogs) => void) : Promise<VIM.Vim>{
      return prevLoad(source, options, (p) => {
        setProgress(p.loaded)
      }).then(_ =>setProgress(undefined))
    }
  },[])

  const msg = 
  progress ==='processing' ? 'Processing'
  : typeof(progress) === 'number' ? `Downloading: ${Math.round(progress / 1000000)} MB`
  : typeof(progress) === 'string' ? `Error: ${progress}`
  : undefined

  if (!msg) return null
  return (
    <div className="vim-loading-box">
      <h1> {msg} </h1>
    </div>
  )
}

function Inspector(props: { viewer: VIM.Viewer })
{
  const viewer = props.viewer
  useEffect(() => {
  // Patch Selection Select
    const prevSelect = viewer.selection.select.bind(viewer.selection)
    viewer.selection.select = (obj) => {
      prevSelect(obj)
      createTable(obj).then(t => setTable(t))
    }

    // Patch Selection Clear
    const prevClear = viewer.selection.clear.bind(viewer.selection)
    viewer.selection.clear = () => {
      prevClear()
      setTable(undefined)
    }
  },[])

  const [table, setTable] = useState<Table>()

  // Patch on click
  useEffect(() => {
    const prevClick = props.viewer.onMouseClick.bind(props.viewer)
    props.viewer.onMouseClick = (hit) => {
      prevClick(hit)
      createTable(hit.object).then(t => setTable(t))
    }
  })

  if(!table) return null

  const set = new Set(["Type", "Name", "FamilyName", "Id"])
  const mains = table.filter(pair => set.has(pair[0])).map((pair, index) => {
    return <tr key={'main-tr' + index} >
      <th key={'main-th' + index}>{pair[0]}</th>
      <td key={'main-td' + index}>{pair[1]}</td>
    </tr>
  })
  
  const details = table.filter(pair => !set.has(pair[0])).map((pair, index) => {
    return <tr key={'details-tr' + index} >
      <th key={'details-th' + index}>{pair[0]}</th>
      <td key={'details-td' + index}>{pair[1]}</td>
    </tr>
  })

  return(
    <div className="vim-bim-explorer">
      <h1>Bim Inspector</h1>
      <div className="main">
        <table>
          <tbody>
            {mains}
          </tbody>
        </table>
      </div>
      <p></p>
      <div className="details">
        <table>
          <thead>
            <tr><th>Details</th></tr>
          </thead>
          <tbody>
            {details}
          </tbody>
        </table>
      </div>

    </div>
  )
}

async function createTable(object: VIM.Object): Promise<[string, string][]>{
  
  if(!object){
    return
  }

  const table = []
  const bim = await object.getBimElement()
  for(let pair of bim){
    const keyParts = pair[0].split(':')
    const key = keyParts[keyParts.length-1]

    const value = typeof(pair[1]) === 'number'
      ? round2(pair[1]).toString() 
      : pair[1]
    table.push([key, value])
  }
  return table
}

function linkState(o: Object, key: string){
  const [_, setState] = useState<boolean>(o[key])
  const {get, set} = patchProperty(o, key, setState.bind(o))
  return [get(), set]
}

function patchProperty(o: Object, key: string, onSet: (v:any) => void){
  
  const proto = Object.getPrototypeOf(o)
  const prev = Object.getOwnPropertyDescriptor(proto, key)

  const get = function(){ return prev.get.apply(o) }
  const set = function(value:any){{
    console.log('set' + key)
    prev.set.apply(o, [value])
    onSet(value)
  }}
  Object.defineProperty(o, key,
  {
    configurable : true,
    get: get,
    set:set,
  })
  return {get , set}
}