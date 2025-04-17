import { createButton, IControlBarButtonItem, isControlBarButtonItem } from './controlBarButton'
import * as Style from './style'

export interface IControlBarSection {
  id: string,
  enable? : (() => boolean) | undefined
  buttons: (IControlBarButtonItem)[]
  style?: string
}

//TODO: Support injecting custom elements
export function createSection (section: IControlBarSection) {
  if (section.enable !== undefined && !section.enable()) return null
  return <div key={section.id} className={`vim-control-bar-section ${section.style ?? Style.sectionDefaultStyle}`}>
      {section.buttons.map(b => createButton(b))}
    </div>
}
