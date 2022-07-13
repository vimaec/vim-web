
// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react'
import logo from './assets/logo.png'
import iconOrbit from './assets/icon_orbit.png'
import iconFirstPerson from './assets/icon_firstperson.png'
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
import iconMeasure from './assets/icon_measure.png'


import * as VIM from 'vim-webgl-viewer/'
import './style.css'

type Progress = 'processing'| number | string
type Table = [string, string][]
type Parameter = {name: string, value: string, group: string}
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

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
  const [measuring, setMeasuring] = useState(false)
  const [measurement, setMeasurement] = useState<VIM.THREE.Vector3>()
  
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

  const btnOrbit = <button className="iconButton" type="button"> <img src={orbit ? iconFirstPerson : iconOrbit} onClick={() => setObit(!orbit)} /></button>
  const btnOrtho = <button className="iconButton" type="button"> <img src={ortho ? iconPerspective : iconOrtho} onClick={() => setOrtho(!ortho)} /></button>

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
  const empty = <td className='empty'></td>
  const rowSection = section
    ? <tr>{empty}<td>{btnSectionActive}</td><td>{btnSection}</td></tr>
    : <tr>{empty}{empty}<td>{btnSection}</td></tr>

  const onIsolateBtn =  function(){
    for (const obj of viewer.selection.object.vim.getAllObjects()) {
      obj.visible = false
    }

    viewer.environment.groundPlane.visible = false
    viewer.selection.object.vim.scene.material = viewer.renderer.materials.isolation
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
    viewer.selection.object.vim.scene.material = viewer.renderer.materials.isolation
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

  const onMeasureBtn = () => {
    if(measuring){
      viewer.gizmoMeasure.clear()
      setMeasuring(false)
    }
    else{
      setMeasurement(undefined)
      setMeasuring(true)
      viewer.gizmoMeasure.measure()
      .then(() => setMeasurement(viewer.gizmoMeasure.measurement))
      .catch(() => setMeasurement(undefined))
      .finally(() => setMeasuring(false))
    }

  }
  const btnMeasure = <button className="iconButton" style={ measuring? {border: "solid"} : {border: "none"} } type="button"><img src={iconMeasure} onClick={onMeasureBtn} /></button>
  const txtMeasure = <div>
    Dist: {measurement?.length().toFixed(2)} <br/>
    X: {measurement?.x.toFixed(2)} <br/>
    Y: {measurement?.y.toFixed(2)} <br/>
    Z: {measurement?.z.toFixed(2)}
  </div>
  
  return <div className="vim-menu">
    <table>
      <tbody>
      <tr>{empty}{empty}<td>{btnOrbit}</td></tr>
      <tr>{empty}{empty}<td>{btnOrtho}</td></tr>
      <tr>{empty}{empty}<td>{btnFocus}</td></tr>
      <tr>{empty}{empty}<td>{btnHome}</td></tr>
      <tr>{empty}{empty}<td>{btnHide}</td></tr>
      <tr>{empty}{empty}<td>{btnShowAll}</td></tr>
      <tr>{empty}{measurement ? txtMeasure : empty}<td>{btnMeasure}</td></tr>
      {rowSection}
      <tr><td>{btnIsolateFamily}</td><td>{btnIsolate}</td><td>{btnIsolateClear}</td></tr>
      </tbody>
    </table>
  </div>
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
  const [parameters, setParameters] = useState<Parameter[]>()

  // Patch on click
  useEffect(() => {
    const prevClick = props.viewer.onMouseClick.bind(props.viewer)
    props.viewer.onMouseClick = (hit) => {
      prevClick(hit)
      createTable(hit.object).then(t => setTable(t))
      if(hit.object){
        hit.object.getBimParameters().then(p => setParameters(p))
      }
      else{
        setParameters(undefined)
      }
      
    }
  })

  if(!table || !parameters) return null

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

  parameters.sort((a, b) =>  a.group.localeCompare(b.group))
  const groups = new Map<string, {name: string, value: string}[]>()
  parameters.map((p) => {
    if(!groups.has(p.group))
      groups.set(p.group, [])
    groups.get(p.group).push(p)
  })

  const elements =[]
  for (const key of groups.keys()) {
    
    const list = groups.get(key)
    elements.push(
      <div className={"parameters"}>
      <table>
        <thead>
          <tr><th>{key}</th></tr>
        </thead>
        <tbody>
          {list.map((p,i) => {
            return <tr key={'parameters-tr' + key + p.name}>
              <th key={'parameters-th' + key + p.name}>{p.name}</th>
              <td key={'parameters-td' + key + p.name}>{p.value}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
    )
  }

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
      {elements}
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