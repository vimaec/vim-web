import React from 'react'

export function createSection (theme: 'white' | 'blue', elements : (JSX.Element | null)[]) {
  const bg = theme === 'white' ? 'vc-bg-white' : 'vc-bg-primary'
  const style = 'vc-flex vc-items-center vc-rounded-full vc-mb-2 vc-px-2 vc-shadow-md'

  return <div className={`${bg} vim-control-bar-section ${style}`}>
      {...elements}
    </div>
}
