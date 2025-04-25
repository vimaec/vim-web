import React from 'react'

export type MessageBoxProps = {
  title: string;
  body: string | JSX.Element;
  footer?: string | JSX.Element;
  canClose?: boolean;
  onClose?: () => void;
}

export type MessageBoxPropsTyped = MessageBoxProps & {
  type: 'message'
}

export function MessageBox (props: {value: MessageBoxProps}) {
  const p = props.value
  if (!p.title || !p.body) return null
  return (
    <div className="vim-message-box vc-p-6 vc-max-h-[80%] vc-max-w-[80%] vc-w-[424px] vc-bg-white vc-rounded-md vc-shadow-message vc-shadow-[0px_4px_16px_rgba(33,39,51,0.5)] vc-font-roboto">
      {/* Header Section */}
      <div className="vc-flex vc-justify-between vc-items-center">
        {title(p.title)}
        {closeBtn(p.onClose)}
      </div>

      {/* Body Section */}
      {divider()}
      {body(p.body)}

      {/* Footer Section  */}
      {footer(p.footer)}
    </div>
  )
}

function title (title: string) {
  return <h2 className="vc-font-bold vc-text-xl vc-text-[#212733]">{title}</h2>
}

function closeBtn (onClose: () => void) {
  if (!onClose) return null
  return <button onClick={onClose} className="vc-text-[#212733] vc-text-xl">
  &times;
  </button>
}

function body (content: string | JSX.Element) {
  if (content === undefined) return null
  if (typeof content === 'string') {
    return <div className="vc-text-[16pt] vc-text-[#212733] vc-whitespace-pre-wrap">
      {content}
    </div>
  }
  return content
}

function footer (content: string | JSX.Element) {
  if (content === undefined) return null
  return <div className="vim-footer vc-justify-start vc-mt-6">
    {content}
  </div>
}

function divider () {
  return <div className="vim-divider vc-border-b vc-border-[#DFDFE1] vc-my-6"></div>
}
