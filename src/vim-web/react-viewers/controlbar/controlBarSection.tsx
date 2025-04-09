import { ReactElement } from 'react'
import { createButton, IControlBarButtonItem, isControlBarButtonItem } from './controlBarButton'
import * as Style from './style'
import React from 'react'


export interface IControlBarSection {
  id: string,
  enable? : (() => boolean) | undefined
  buttons: (IControlBarButtonItem | ReactElement)[]
  style?: string
}


export function createSection (section: IControlBarSection) {
  if (section.enable !== undefined && !section.enable()) return null
  return <div key={section.id} className={`vim-control-bar-section ${section.style ?? Style.sectionDefaultStyle}`}>
      {section.buttons.map(b => {
        if (React.isValidElement(b)) {
          return b;
        }

        if(isControlBarButtonItem(b)){
          return createButton(b)
        }

        return null
      })
    }
    </div>
}
