export const baseSectionStyle = 'vc-flex vc-items-center vc-rounded-full vc-mb-2 vc-shadow-md'
export const sectionDefaultStyle = baseSectionStyle + ' vc-bg-white'
export const sectionBlueStyle = baseSectionStyle + ' vc-bg-primary'
export const sectionNoPadStyle = baseSectionStyle.replace('vc-px-2','') + ' vc-bg-white'


export const buttonBaseStyle = 'vim-control-bar-button vc-rounded-full vc-items-center vc-justify-center vc-flex vc-transition-all hover:vc-scale-110'
export function buttonDefaultStyle (on: boolean) {
  return on
    ? buttonBaseStyle + ' vc-text-primary'
    : buttonBaseStyle + ' vc-text-gray-medium'
}

export function buttonExpandStyle (on: boolean) {
  return on
    ? buttonBaseStyle + ' vc-text-white vc-bg-primary'
    : buttonBaseStyle + ' vc-text-gray-medium'
}

export function buttonDisableStyle (on: boolean) {
  return on
    ? buttonBaseStyle + ' vc-text-gray-medium'
    : buttonBaseStyle + ' vc-text-gray vc-pointer-events-none'
}

export function buttonDisableDefaultStyle (on: boolean) {
  return on
    ? buttonBaseStyle + ' vc-text-primary'
    : buttonBaseStyle + ' vc-text-gray vc-pointer-events-none'
}

export function buttonBlueStyle (on: boolean) {
  return buttonBaseStyle + ' vc-text-white'
}
