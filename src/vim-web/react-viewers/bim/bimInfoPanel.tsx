
import { useEffect, useState } from 'react'
import * as Core from '../../core-viewers'
import ReactTooltip from 'react-tooltip'
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

  useEffect(() => {
    ReactTooltip.rebuild()
  })

  const [data, setData] = useState<Data>()

  useEffect(() => {
    async function update() {
      let data = props.object === undefined
        ? await getVimData(props.vim)
        : await getObjectData(target, props.elements)
      data = await props.bimInfoRef.onData(data, target ?? props.vim)
      setData(data)
    }
    update()
  }, [props.object, props.vim, props.elements, props.bimInfoRef])

  return (
    <div className='vim-bim-lower'>
      <h2 className="vim-bim-lower-title">
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
