import { createButton, IControlBarButton } from './controlBarButton'
import { SectionVariant } from './style'

export interface IControlBarSection {
  id: string,
  enable? : (() => boolean) | undefined
  buttons: (IControlBarButton)[]
  variant?: SectionVariant
}

export function createSection (section: IControlBarSection) {
  if (section.enable !== undefined && !section.enable()) return null
  return (
    <div key={section.id} className='vim-control-bar-section' data-variant={section.variant ?? 'default'}>
      {section.buttons.map(b => createButton(b))}
    </div>
  )
}
