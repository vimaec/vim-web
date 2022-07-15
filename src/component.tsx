
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
const IconFirstPerson = ({ height, width, fill }) => (
  <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <path fill={fill} d="m223.658 209.952-54.829-29.907c10.414-15.208 16.168-33.38 16.168-52.045s-5.753-36.837-16.167-52.046l54.829-29.906c7.757-4.231 10.615-13.95 6.384-21.707-4.23-7.757-13.946-10.616-21.708-6.384L32.336 113.955a15.999 15.999 0 0 0 0 28.092l175.998 95.997a15.922 15.922 0 0 0 7.647 1.957c5.666 0 11.157-3.017 14.06-8.341 4.231-7.758 1.373-17.476-6.384-21.707Zm-76.054-122.42c8.599 11.632 13.393 25.84 13.393 40.468s-4.793 28.836-13.393 40.468L73.412 128l74.193-40.468Z"/>
  </svg>
);
const IconPerspective = ({ height, width, fill }) => (
  <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <path fill={fill} d="m228.729 46.855-188-37.961a34.146 34.146 0 0 0-6.75-.676C15.243 8.218 0 23.471 0 42.221v171.558c0 18.75 15.243 34.003 33.979 34.003 2.258 0 4.529-.227 6.75-.676l188-37.962c15.802-3.19 27.271-17.207 27.271-33.327V80.183c0-16.121-11.469-30.137-27.271-33.327ZM154 56.25v143.5l-52 10.5V45.75l52 10.5ZM35.979 223.581c-.674.136-1.343.201-2 .201-5.384 0-9.979-4.373-9.979-10.003V42.221c0-5.63 4.596-10.003 9.979-10.003.657 0 1.326.065 2 .201L78 40.904v174.192l-42.021 8.485ZM232 175.817a10 10 0 0 1-8.021 9.802L178 194.903V61.096l45.979 9.284A10 10 0 0 1 232 80.182v95.635Z"/>
  </svg>
);
const IconOrthographic = ({ height, width, fill }) => (
  <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <path fill={fill} d="M194 116h-3.14c-4.881-25.719-25.141-45.979-50.86-50.86V62c0-4.4-3.6-8-8-8h-8c-4.4 0-8 3.6-8 8v3.14C90.281 70.021 70.021 90.281 65.14 116H62c-4.4 0-8 3.6-8 8v8c0 4.4 3.6 8 8 8h3.14c4.881 25.719 25.141 45.979 50.86 50.86V194c0 4.4 3.6 8 8 8h8c4.4 0 8-3.6 8-8v-3.14c25.719-4.881 45.979-25.141 50.86-50.86H194c4.4 0 8-3.6 8-8v-8c0-4.4-3.6-8-8-8Zm-54 50.159V162c0-4.4-3.6-8-8-8h-8c-4.4 0-8 3.6-8 8v4.159c-12.421-3.915-22.244-13.738-26.159-26.159H94c4.4 0 8-3.6 8-8v-8c0-4.4-3.6-8-8-8h-4.158C93.757 103.579 103.58 93.756 116 89.841V94c0 4.4 3.6 8 8 8h8c4.4 0 8-3.6 8-8v-4.159c12.421 3.915 22.244 13.738 26.159 26.159H162c-4.4 0-8 3.6-8 8v8c0 4.4 3.6 8 8 8h4.159c-3.915 12.421-13.738 22.244-26.159 26.159Z"/>
    <path fill={fill} d="M248 116h-4.615C237.785 61.518 194.481 18.214 140 12.615V8c0-4.4-3.6-8-8-8h-8c-4.4 0-8 3.6-8 8v4.615C61.519 18.214 18.214 61.518 12.615 116H8c-4.4 0-8 3.6-8 8v8c0 4.4 3.6 8 8 8h4.615c5.6 54.482 48.904 97.786 103.385 103.385V248c0 4.4 3.6 8 8 8h8c4.4 0 8-3.6 8-8v-4.615c54.481-5.6 97.786-48.904 103.385-103.385H248c4.4 0 8-3.6 8-8v-8c0-4.4-3.6-8-8-8ZM140 219.218V216c0-4.4-3.6-8-8-8h-8c-4.4 0-8 3.6-8 8v3.218C74.849 213.834 42.167 181.151 36.782 140H40c4.4 0 8-3.6 8-8v-8c0-4.4-3.6-8-8-8h-3.218C42.166 74.849 74.849 42.167 116 36.783v3.218c0 4.4 3.6 8 8 8h8c4.4 0 8-3.6 8-8v-3.218c41.151 5.384 73.833 38.067 79.218 79.218H216c-4.4 0-8 3.6-8 8v8c0 4.4 3.6 8 8 8h3.218c-5.384 41.151-38.067 73.833-79.218 79.218Z"/>
  </svg>
);
const IconBox = ({ height, width, fill }) => (
  <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <path fill={fill} d="m110.051 2.173-92.41 53.253a16.213 16.213 0 0 0-8.125 14.047V175.98a16.215 16.215 0 0 0 8.125 14.047l95.112 54.792c1.354.78 3.047-.195 3.047-1.756V121.339l105.613-60.862c1.354-.78 1.354-2.731 0-3.512L126.301 2.173a16.278 16.278 0 0 0-16.25 0ZM95.488 211.458l-65.659-37.82V82.577l65.66 37.82v91.062Zm10.266-107.741L40.096 65.898l78.08-44.996 65.66 37.819-78.081 44.996Z"/>
    <path fill={fill} d="M138.483 135.324v118.658c0 1.551 1.682 2.521 3.028 1.745l96.896-55.839a16.117 16.117 0 0 0 8.076-13.961V74.25c0-1.551-1.682-2.521-3.028-1.745l-102.953 59.329a4.029 4.029 0 0 0-2.019 3.49Z"/>
  </svg>
);
const IconHome = ({ height, width, fill }) => (
  <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <path fill={fill} d="M136 36c0 6.627 5.373 12 12 12h43.03l-51.515 51.515c-4.686 4.687-4.686 12.284 0 16.971 4.686 4.686 12.284 4.686 16.971 0l51.515-51.515V108c0 6.627 5.373 12 12 12s12-5.373 12-12V36c0-3.071-1.172-6.142-3.515-8.485A11.963 11.963 0 0 0 220.001 24h-72c-6.627 0-12 5.373-12 12ZM120 220c0-6.627-5.373-12-12-12H64.97l51.515-51.515c4.686-4.687 4.686-12.284 0-16.971-4.686-4.686-12.284-4.686-16.971 0l-51.515 51.515V148c0-6.627-5.373-12-12-12s-12 5.373-12 12v72c0 3.071 1.172 6.142 3.515 8.485A11.963 11.963 0 0 0 35.999 232H108c6.627 0 12-5.373 12-12Z"/>
  </svg>
);
const IconCamera = ({ height, width, fill }) => (
  <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
    <path fill={fill} d="M213.788,28a1.8,1.8,0,1,0,1.805,1.8A1.8,1.8,0,0,0,213.788,28Zm-1.041,4.124a5.191,5.191,0,0,0-4.008,2.3,6.031,6.031,0,0,0-.577,3.262.705.705,0,1,0,1.411,0,4.967,4.967,0,0,1,.375-2.531,3.936,3.936,0,0,1,1.461-1.225c-.251,1.161-.481,2.324-.716,3.481l3.35,7.958a1.008,1.008,0,1,0,1.857-.782l-2.695-6.4.343-1.432.251-1.049c.72,1.308,2.393,1.662,3.537,1.934a.705.705,0,1,0,.323-1.373,4.968,4.968,0,0,1-2.375-.952,2.5,2.5,0,0,1-.6-.972c-.165-.46-.242-.967-.389-1.421v0h0c-.308-.794-.863-.79-1.551-.792Zm-2.274,6.339-.683,3.387-1.563,2.612a1.008,1.008,0,1,0,1.729,1.035l1.7-2.842a1.007,1.007,0,0,0,.143-.5l0-.532-1.33-3.161Z" transform="translate(-208.076 -28)" />
  </svg>
);
const IconMeasure = ({ height, width, fill }) => (
  <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <path fill={fill} d="M118.464 79.224C98.5 69.487 74.337 77.807 64.6 97.771c-9.737 19.964-1.417 44.127 18.547 53.864 19.964 9.737 44.127 1.417 53.864-18.547 9.737-19.964 1.417-44.127-18.547-53.864Zm-27.181 55.73c-10.783-5.259-15.261-18.264-10.002-29.047s18.264-15.261 29.047-10.002c10.783 5.259 15.261 18.264 10.002 29.047-5.259 10.783-18.264 15.261-29.047 10.002Z"/>
    <path fill={fill} d="M250.342 162.614c-4.999-2.438-11.028-.362-13.466 4.637l-3.532 7.241-14.481-7.063h-.002l-21.722-10.595-14.482-7.064 13.252-27.171c12.279-25.176 5.849-54.232-16.333-69.89l2.089-4.284c4.856-9.956.683-22.076-9.273-26.932L132.566 2.068c-9.956-4.856-22.076-.683-26.932 9.273l-2.089 4.284c-25.995-7.839-54.661 4.1-66.94 29.275L5.703 108.26c-13.632 27.949-1.984 61.778 25.966 75.409L134.863 234a6.033 6.033 0 0 0 8.067-2.778l2.645-5.422 59.739 29.137c4.999 2.438 11.028.362 13.466-4.637l32.668-66.98 3.532-7.241c2.438-4.999.362-11.028-4.637-13.466ZM120.117 18.405c.957-1.963 3.424-2.812 5.386-1.855l39.826 19.424c1.963.957 2.812 3.424 1.855 5.386l-1.766 3.621-47.067-22.956 1.766-3.621Zm40.817 120.769-31.777 65.153-86.893-42.38c-15.93-7.77-22.607-27.161-14.837-43.091l30.902-63.359c7.77-15.93 27.161-22.607 43.091-14.837l59.739 29.137c15.93 7.77 20.797 26.278 13.027 42.208l-13.252 27.171Zm44.157 93.246-50.687-24.722 19.424-39.826 7.241 3.532-8.829 18.103a8.056 8.056 0 1 0 14.482 7.064l8.829-18.103 7.241 3.532-8.829 18.103a8.056 8.056 0 1 0 14.482 7.064l8.829-18.103 7.241 3.532-19.424 39.826Z"/>
  </svg>
);
const IconMore = ({ height, width, fill }) => (
  <svg height={height} width={width} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <path fill={fill} d="M32 160c-17.644 0-32-14.356-32-32s14.356-32 32-32 32 14.356 32 32-14.356 32-32 32ZM128 160c-17.644 0-32-14.356-32-32s14.356-32 32-32 32 14.356 32 32-14.356 32-32 32ZM224 160c-17.644 0-32-14.356-32-32s14.356-32 32-32 32 14.356 32 32-14.356 32-32 32Z"/>
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
  menuTop?: boolean,
  loading?: boolean
}) {
  const useLogo = props.logo === undefined ? true: props.logo
  const useInspector = props.inspector === undefined ? true: props.inspector
  const useMenu = props.menu === undefined ? true: props.menu
  const useMenuTop = props.menuTop === undefined ? true: props.menuTop
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
      {useMenuTop ? <MenuTop viewer={props.viewer} section={section} setSection={setSection}/> : null}
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

  const btnOrbit = <button onClick={() => setObit(!orbit)} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${orbit ? 'bg-primary-royal' : ''}`} type="button"><IconOrbit height="32" width="32" fill="currentColor" /></button>
  const btnOrtho = <button onClick={() => setOrtho(!ortho)} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${ortho ? 'bg-primary-royal' : ''}`} type="button"><IconPerspective height="32" width="32" fill="currentColor" /></button>
  // const btnOrtho = <button className="iconButton" type="button"> <img src={ortho ? iconPerspective : iconOrtho} onClick={() => setOrtho(!ortho)} /></button>

  const onFocusButton = function () {
    if(!selection) return
    viewer.camera.frame(selection, true, viewer.camera.defaultLerpDuration)
  }

  const btnFocus = <button  className="iconButton" type="button" disabled={!selection}><img src={iconFocus} onClick={onFocusButton} /></button>
  // const btnFocus = <button onClick={onFocusButton} disabled={!selection} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 disabled:opacity-50`} type="button"><IconFocus height="32" width="32" fill="currentColor" /></button>
  iconHome
  const onHomeButton = function(){
    viewer.camera.frame('all', true, viewer.camera.defaultLerpDuration)
  }
  // const btnHome = <button className="iconButton"  type="button"><img src={iconHome} onClick={onHomeButton} /></button>
  const btnHome = <button onClick={onHomeButton} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 disabled:opacity-50`} type="button"><IconHome height="32" width="32" fill="currentColor" /></button>
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

  // const btnSection = <button  className="iconButton" type="button"><img src={iconSection} onClick={onSectionButton} /></button>
  const btnSection = <button onClick={onSectionButton} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${section ? 'bg-primary-royal hover:bg-primary-royal' : ''}`} type="button"><IconBox height="32" width="32" fill="currentColor" /></button>
  
  const btnMeasure = <button className={"rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40"} type="button"><IconMeasure height="32" width="32" fill="currentColor" /></button>

  const btnMore = <button className={"rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40"} type="button"><IconMore height="32" width="32" fill="currentColor" /></button>

  const onActivateSectionButton = function (){
    viewer.gizmoSection.clip = !sectionActive
    setSectionActive(!sectionActive)
  }

  console.log('btnSectionActive:' + sectionActive)
  const btnSectionActive = <button className="iconButton" type="button"><img src={sectionActive ? iconSectionClipOn : iconSectionClipOff} onClick={onActivateSectionButton} /></button>
  const empty = <span className='empty'></span>
  const rowSection = section
    ? <div className='flex items-center'>{empty}{empty}{btnSection}</div>
    : <div className='flex'>{empty}{empty}{btnSection}</div>

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

   
  return <div className="vim-menu flex  fixed right-2 bottom-2">
    <div className='mx-1'>{rowSection}</div>
    <div className='mx-1'>{empty}{empty}{btnMeasure}</div>
    <div className='mx-1'>{empty}{empty}{btnHome}</div>
    <div className='mx-1'>{empty}{empty}{btnMore}</div>
  </div>
}
function MenuTop(props: {viewer: VIM.Viewer, section: boolean, setSection: (value: boolean)=> void}){
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

  const btnOrbit = <button onClick={() => setObit(!orbit)} className={"rounded-full text-white h-8 w-8 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40"} type="button">{orbit ? <IconOrbit height="20" width="20" fill="currentColor" /> : <IconFirstPerson height="20" width="20" fill="currentColor" />}</button>
  const btnOrtho = <button onClick={() => setOrtho(!ortho)} className={"rounded-full text-white h-8 w-8 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40"} type="button">{ortho ? <IconPerspective height="20" width="20" fill="currentColor" /> : <IconOrthographic height="20" width="20" fill="currentColor" />}</button>
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
  // const btnHome = <button className="iconButton"  type="button"><img src={iconHome} onClick={onHomeButton} /></button>
  const btnHome = <button onClick={onHomeButton} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 disabled:opacity-50`} type="button"><IconHome height="32" width="32" fill="currentColor" /></button>
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

  // const btnSection = <button  className="iconButton" type="button"><img src={iconSection} onClick={onSectionButton} /></button>
  const btnSection = <button onClick={onSectionButton} className={`rounded-full text-white h-12 w-12 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 ${section ? 'bg-primary-royal' : ''}`} type="button"><IconBox height="32" width="32" fill="currentColor" /></button>

  const onActivateSectionButton = function (){
    viewer.gizmoSection.clip = !sectionActive
    setSectionActive(!sectionActive)
  }

  console.log('btnSectionActive:' + sectionActive)
  const btnSectionActive = <button className="iconButton" type="button"><img src={sectionActive ? iconSectionClipOn : iconSectionClipOff} onClick={onActivateSectionButton} /></button>
  const empty = <span className='empty'></span>
  const rowSection = section
    ? <div className='flex items-center'>{empty} {btnSectionActive}{btnSection}</div>
    : <div className='flex'>{empty}{empty}{btnSection}</div>

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
  const btnCamera = <button className={"rounded-full text-white text-sm h-8 w-8 flex items-center justify-center transition-all hover:scale-110 hover:bg-hover-t40 opacity-75"} type="button"><IconCamera height="20" width="20" fill="currentColor" />12</button>
   
  return <div className='flex flex-col mx-2 my-0 fixed right-0 top-2 w-auto'>
    <div className='border border-hover-t40 h-28 w-full rounded-t-md'> </div>
    <div className="vim-menu flex bg-hover-t40 p-1 rounded-b-md">
      <div className='mx-1'>{empty}{empty}{btnOrbit}</div>
      <div className='mx-1'>{empty}{empty}{btnOrtho}</div>
      <div className='mx-1'>{empty}{empty}{btnCamera}</div>
    </div>
  </div>
}

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