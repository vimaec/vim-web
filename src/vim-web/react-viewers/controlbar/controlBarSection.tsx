import { createButton, IControlBarButtonItem } from './controlBarButton'

const sectionStyle = 'vc-flex vc-items-center vc-rounded-full vc-mb-2 vc-shadow-md'
export const sectionDefaultStyle = sectionStyle + ' vc-bg-white'
export const sectionBlueStyle = sectionStyle + ' vc-bg-primary'
export const sectionNoPadStyle = sectionStyle.replace('vc-px-2','') + ' vc-bg-white'

export interface IControlBarSection {
  id: string,
  enable? : (() => boolean) | undefined
  buttons: IControlBarButtonItem[]
  style?: string
}

export function createSection (section: IControlBarSection) {
  if (section.enable !== undefined && !section.enable()) return null
  return <div key={section.id} className={`vim-control-bar-section ${section.style ?? sectionDefaultStyle}`}>
      {section.buttons.map(b => createButton(b))}
    </div>
}
