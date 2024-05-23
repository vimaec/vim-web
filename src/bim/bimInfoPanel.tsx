
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
  <>
    <h2 style={{ top: props.full ? '0px' : 'max(55%, 160px)' }}
     className="vc-absolute vc-font-bold vc-uppercase">
      Bim Inspector
    </h2>
    <div style={{ top: props.full ? '1.5rem' : 'calc(max(55%, 160px) + 1.5rem)' }}
      className={'vim-bim-lower vc-absolute vc-bottom-0 vc-right-0 vc-left-0 vc-overflow-y-auto vc-overflow-x-hidden'}>
      {header()}
      {body()}
    </div>
  </>
  )
}
