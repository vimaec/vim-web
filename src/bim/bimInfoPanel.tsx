
import React, { useEffect, useState } from 'react'
import * as VIM from 'vim-webgl-viewer/'
import ReactTooltip from 'react-tooltip'
import { BimBody } from './bimInfoBody'
import { BimHeader } from './bimInfoHeader'
import { getObjectData } from './bimInfoObject'
import { getVimData } from './bimInfoVim'
import { AugmentedElement } from '../helpers/element'
import { Data, BimInfoPanelRef } from './bimInfoData'

export function BimInfoPanel (props : {
    object: VIM.Object,
    vim: VIM.Vim,
    elements: AugmentedElement[],
    full : boolean
    bimInfoRef: BimInfoPanelRef
  }
) {
  useEffect(() => {
    ReactTooltip.rebuild()
  })

  const [data, setData] = useState<Data>()

  useEffect(() => {
    // Update data when inputs change
    async function update () {
      let data = props.object === undefined
        ? await getVimData(props.vim)
        : await getObjectData(props.object, props.elements)
      data = await props.bimInfoRef.onData(data, props.object ?? props.vim)
      setData(data)
    }
    // UseEffect doesn't accept async functions so we need to wrap it
    update()
  }
  , [props.object, props.vim, props.elements, props.bimInfoRef])

  const header = () => {
    const standard = () => <BimHeader bimInfoRef={props.bimInfoRef} entries={data?.header}/>
    if (props.bimInfoRef.onRenderHeader !== undefined) {
      return React.createElement(props.bimInfoRef.onRenderHeader, { data: data?.header, standard })
    }
    return standard()
  }

  const body = () => {
    const standard = () => <BimBody bimInfoRef={props.bimInfoRef} sections={data?.body} />
    if (props.bimInfoRef.onRenderBody !== undefined) {
      return React.createElement(props.bimInfoRef.onRenderBody, { data: data?.body, standard })
    }
    return standard()
  }

  return (
  <div className='vim-bim-lower vc-flex vc-flex-col vc-max-h-full'>
    <h2 className="vim-bim-lower-title vc-title">
      Bim Inspector
    </h2>
    <div className={'vim-bim-lower-content vc-flex-1 vc-min-h-0 vc-flex vc-flex-col vc-overflow-y-auto vc-overflow-x-hidden'}>
      {header()}
      {body()}
    </div>
  </div>
  )
}
