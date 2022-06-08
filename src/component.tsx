
// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react'
import logo from './assets/logo.png'
import * as VIM from 'vim-webgl-viewer/'
import './style.css'

const canvasId = 'vim-canvas'

type Progress = 'processing'| number | string
type Table = [string, string][]
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

export function createRoot(){
  const r = document.createElement('div')
  r.className = 'vim'
  r.style.height = '100%'
  document.body.append(r)
  return r
}

export function VimComponent (props: {onViewerReady: (vim: VIM.Viewer) => void}) {
  const [progress, setProgress] = useState<Progress>()
  const [table, setTable] = useState<Table>()
  useEffect(() => {
    const viewer = new VIM.Viewer({ 
      canvas: {id : canvasId},
      groundPlane: {
        show: true,
        texture:
          'https://vimdevelopment01storage.blob.core.windows.net/textures/vim-floor-soft.png',
        opacity: 1,
        size: 5
      }
    })
  
    // Patch on click
    const previous = viewer.onMouseClick.bind(viewer)
    viewer.onMouseClick = (hit) => {
      previous(hit)
      createTable(hit.object).then(t => setTable(t))
    }

      // Patch load
    const prev = viewer.loadVim.bind(viewer)
    viewer.loadVim = function (source: string| ArrayBuffer, options: VIM.VimOptions.Root, _ : (logger: VIM.IProgressLogs) => void) : Promise<VIM.Vim>{
      return prev(source, options, (p) => {
        setProgress(p.loaded)
      }).then(_ =>setProgress(undefined))
    }
    props.onViewerReady(viewer)
  }, [])
  
  return (
    <>
      <canvas id={canvasId}> </canvas>
      <Logo />
      <LoadingBox progress={progress} />
      <Inspector data={table}/>
      <Menu/>
    </>
  )
}

function Menu(){
  return <div className="vim-menu">
    <table>
      <tbody>
      <tr><td><button type="button">Camera</button></td></tr>
      <tr><td><button type="button">Ortho</button></td></tr>
      <tr><td><button type="button">Focus</button></td></tr>
      <tr><td><button type="button">Home</button></td></tr>
      <tr><td><button type="button">Fullscreen</button></td></tr>
      <tr><td><button type="button">Hide</button></td></tr>
      <tr><td><button type="button">Show All</button></td></tr>
      </tbody>
    </table>
  </div>
}

function Logo () {
  return (
    <div className="vim-logo">
      <a href="https://vimaec.com">
        <img src={logo}></img>
      </a>
    </div>
  )
}

function LoadingBox (prop: { progress: Progress }) {
  const msg = 
  prop.progress ==='processing' ? 'Processing'
  : typeof(prop.progress) === 'number' ? `Downloading: ${Math.round(prop.progress / 1000000)} MB`
  : typeof(prop.progress) === 'string' ? `Error: ${prop.progress}`
  : undefined

  if (!msg) return null
  return (
    <div className="vim-loading-box">
      <h1> {msg} </h1>
    </div>
  )
}

function Inspector(prop: { data: Table })
{
  if(!prop.data) return null

  const set = new Set(["Type", "Name", "FamilyName", "Id"])
  const mains = prop.data.filter(pair => set.has(pair[0])).map((pair, index) => {
    return <tr key={'main-tr' + index} >
      <th key={'main-th' + index}>{pair[0]}</th>
      <td key={'main-td' + index}>{pair[1]}</td>
    </tr>
  })
  
  const details = prop.data.filter(pair => !set.has(pair[0])).map((pair, index) => {
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
