/**
 * @module viw-webgl-react
 */

import Stats from 'stats-js'

/**
 * Adds popular performance gizmo from package stat-js
 */
export function addPerformanceCounter (parent: HTMLDivElement) {
  const stats = new Stats()
  const div = stats.dom as HTMLDivElement
  div.className = 'vim-performance'
  parent.appendChild(div)
  div.style.zIndex = '35'

  function animate () {
    requestAnimationFrame(() => animate())
    stats.update()
  }
  animate()
}
