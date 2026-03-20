export function mainText (text: JSX.Element) {
  return <p className="vim-main-text">{text}</p>
}

export function detailText (text: string) {
  return <span className="vim-detail-text">{text}</span>
}

export function bold (text: string) {
  return <span className="vim-bold-text">{text}</span>
}

export function subTitle (title: string) {
  return <p className="vim-sub-title">{title}</p>
}

export function dotList (elements: (JSX.Element | string)[]) {
  return (
    <ul className="vim-dot-list">
      {elements.filter(v => v).map((element, index) => (
        <li key={index}>{element}</li>
      ))}
    </ul>
  )
}

export function numList (elements: (JSX.Element | string)[]) {
  return (
    <ul className="vim-num-list">
      {elements.filter(v => v).map((element, index) => (
        <li key={index}>{element}</li>
      ))}
    </ul>
  )
}

export function bullet (label: string, value: string) {
  return <>
    <span className="vim-bullet-label">{label}</span>{' '}
    <span className="vim-bullet-value">{value}</span>
  </>
}

export function link (url: string, text: string) {
  return <a href={url} target="_blank" className="vim-link">{text}</a>
}

export function footer () {
  return <></>
}
