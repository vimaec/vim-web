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
  const navigate = useNavigate()
  const pageInfo = findPage(window.location.pathname)
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
    <BrowserRouter basename="/">
      <Navigation />
        <Routes>
        {ultraPages.map((page, index) => (
            <Route key={index} path={page.path} element={page.component} />
        ))}
        {webglPages.map((page, index) => (
            <Route key={index} path={page.path} element={page.component} />
        ))}
        {/* Default page */}
        <Route path="*" element={<Navigate to="/webgl" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

const container = document.getElementById('root')
if (!container) throw new Error('No container found')
const root = createRoot(container) // createRoot(container!) if you use TypeScript
root.render(<App/>)
