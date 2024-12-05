import React from 'react'
import { BrowserRouter, Route, Routes, useNavigate, Navigate } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { WebglHome } from './webgl/00_home'
import { WebglAccessToken } from './webgl/01_accessToken'
import { ultraPages } from './ultra/ultraPageIndex'

const webglPages = [
  { path: '/webgl', component: <WebglHome /> },
  { path: '/webgl/accessToken', component: <WebglAccessToken /> }
]

function findPage (path: string) {

  const webglIndex = webglPages.findIndex(page => page.path === path)
  if (webglIndex >= 0) {
    return { source: webglPages, index: webglIndex }
  }
  const ultraIndex = ultraPages.findIndex(page => page.path === path)
  if (ultraIndex >= 0) {
    return { source: ultraPages, index: ultraIndex }
  }
  return undefined
}

function Navigation () {
  console.log('Navigation')
  const navigate = useNavigate()
  const path = window.location.pathname.replace("/vim-web", '')
  const pageInfo = findPage(path)
  if (!pageInfo) {
    return null
  }

  const handleNext = () => {
    const nextIndex = (pageInfo.index + 1) % pageInfo.source.length
    void navigate(pageInfo.source[nextIndex].path)
  }

  const handlePrev = () => {
    const prevIndex = (pageInfo.index - 1 + pageInfo.source.length) % pageInfo.source.length
    void navigate(pageInfo.source[prevIndex].path)
  }

  return (
    <div className='navigation vc-fixed vc-top-0 vc-left-1/2 vc--translate-x-1/2 vc-z-50'>
      <button onClick={handlePrev}>Previous</button>
      <button onClick={handleNext}>Next</button>
    </div>
  )
}

function App () {
  return (
    <BrowserRouter basename="/vim-web/">
      <Navigation />
      <Routes>
        {ultraPages.map((page, index) => (
            <Route key={index} path={page.path} element={page.component} />
        ))}
        {webglPages.map((page, index) => (
            <Route key={index} path={page.path} element={page.component} />
        ))}
        {/* Default page */}
        <Route path="*" element={<Navigate to="/webgl"/>} />
        <Route key="api" path="/api" element={<ApiDocs />} />
      </Routes>
    </BrowserRouter>
  )
}

function ApiDocs() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <iframe
        src="/api/index.html"
        style={{ height: '100%', width: '100%', border: 'none' }}
        title="API Docs"
      ></iframe>
    </div>
  );
} 

const container = document.getElementById('root')
if (!container) throw new Error('No container found')
const root = createRoot(container) // createRoot(container!) if you use TypeScript
root.render(<App/>)
