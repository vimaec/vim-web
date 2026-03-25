
import { useEffect, useRef, useState } from 'react'
import * as Core from '../../core-viewers'
import { getObjectData } from './bimInfoObject'
import { getVimData } from './bimInfoVim'
import { AugmentedElement } from '../helpers/element'
import { Data, BimInfoPanelApi } from './bimInfoData'
import { GenericContent } from '../generic/genericField'
import { headerToEntries, bodyToEntries } from './bimInfoConvert'

export function BimInfoPanel(props: {
  object: Core.Webgl.IElement3D
  vim: Core.Webgl.IWebglVim
  elements: AugmentedElement[]
  full: boolean
  bimInfoRef: BimInfoPanelApi
}) {
  const target = props.object?.type === 'Element3D' ? props.object : undefined

  const [data, setData] = useState<Data>()

  const debounce = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => {
    let cancelled = false
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      if (cancelled) return
      // Yield to let the UI update before starting the expensive BIM query
      await new Promise(r => setTimeout(r, 0))
      if (cancelled) return
      let data = props.object === undefined
        ? await getVimData(props.vim)
        : await getObjectData(target, props.elements)
      if (cancelled) return
      // Yield again so the browser can paint between query and render
      await new Promise(r => setTimeout(r, 0))
      if (cancelled) return
      data = await props.bimInfoRef.onData(data, target ?? props.vim)
      if (cancelled) return
      setData(data)
    }, 50)
    return () => { cancelled = true; clearTimeout(debounce.current) }
  }, [props.object, props.vim, props.elements, props.bimInfoRef])

  return (
    <div className='vim-bim-lower'>
      <h2 className="vim-bim-lower-title" data-tip="Bim Inspector">
        Bim Inspector
      </h2>
      <div className='vim-bim-lower-content'>
        {data
          ? <>
              <div className="vim-bim-header"><GenericContent items={headerToEntries(data, props.bimInfoRef)} /></div>
              <div className="vim-bim-body"><GenericContent items={bodyToEntries(data, props.bimInfoRef)} /></div>
            </>
          : <span>Loading . . .</span>
        }
      </div>
    </div>
  )
}
