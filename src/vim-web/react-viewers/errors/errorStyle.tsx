export const vcColorPrimary = 'vc-text-[#212733]'
export const vcColorSecondary = 'vc-text-[#787C83]'
export const vcColorLink = 'vc-text-[#0590CC]'
export const vcLink = `${vcColorLink} vc-underline`
export const vcLabel = 'vc-text-[#3F444F]'
export const vcRoboto = 'vc-font-[\'Roboto\',sans-serif]'

export function footer () {
  return <></>
}

export function mainText (text: JSX.Element) {
  return <p className={`vim-main-text vc-text-base ${vcColorPrimary} vc-mb-4 vc-font-normal`}>
    {text}
  </p>
}

export function detailText (text: string) {
  return <span className={`${vcColorSecondary} vc-text-base vc-italic vc-break-words vc-font-normal`}>{text}</span>
}

export function bold (text: string) {
  return <span className="vc-text-base vc-font-bold">{text}</span>
}

export function subTitle (title: string) {
  return <p className={`vc-text-base vc-mb-1 vc-font-bold ${vcColorPrimary}`}>{title}</p>
}

export function dotList (elements: (JSX.Element | string)[]) {
  return (
    <ul className={`vc-space-y-1 vc-ml-5 ${vcColorPrimary} vc-mb-4`}>
      {elements.filter(v => v).map((element, index) => (
        <li className='vc-list-disc vc-text-base vc-font-normal' key={index}>{element}</li>
      ))}
    </ul>
  )
}

export function numList (elements: (JSX.Element | string)[]) {
  return (
    <ul className={`vc-space-y-1 vc-ml-5 ${vcColorPrimary} vc-mb-4`}>
      {elements.filter(v => v).map((element, index) => (
        <li className='vc-list-decimal vc-text-base vc-font-normal' key={index}>{element}</li>
      ))}
    </ul>
  )
}

export function bullet (label: string, value: string) {
  return <>
    <span className={vcLabel}>{label}</span> <span className={` vc-break-all  ${vcColorSecondary}`}>{value}</span>
  </>
}

export function link (url: string, text: string) {
  return <a href={url} target="_blank" className={vcLink}>
    {text}
  </a>
}
