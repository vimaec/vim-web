import React from 'react'

export type MessageBoxProps = {
  type: 'message'
  title: string;
  message: string;
  file?: string;
  url?: string;
  footer?: string;
  link?: string;
  onClose?: () => void;
}
export function MessageBox (props: {value: MessageBoxProps}) {
  const p = props.value
  if (p === undefined) return null
  return (
    <div className="vim-message-box vc-p-6 vc-max-w-[400px] vc-w-[80%] vc-bg-white vc-rounded-md vc-shadow-message vc-shadow-[0px_4px_16px_rgba(33,39,51,0.5)] vc-font-roboto vc-w-full">
      {/* Header Section */}
      <div className="vc-flex vc-justify-between vc-items-center vc-mb-6">
        {title(p.title)}
        {closeBtn(p.onClose)}
      </div>

      {/* Info Section */}
      {hasInfo(p) && divider()}
      <div className="vc-space-y-6 vc-mb-6">
        {p.file !== undefined && infoPair('File', p.file)}
        {p.url !== undefined && infoPair('URL', p.url)}
      </div>

      {/* Body Section */}
      {hasBody(p) && divider()}
      {body(p.message)}

      {/* Footer Section  */}
      {hasFooter(p) && divider()}
      {footer(p.footer, p.link)}
    </div>
  )
}

function title (title: string) {
  return <h2 className="vc-font-bold vc-text-[20pt] vc-text-[#212733]">{title}</h2>
}

function closeBtn (onClose: () => void) {
  if (!onClose) return null
  return <button onClick={onClose} className="vc-text-[#212733] vc-text-xl">
  &times;
  </button>
}

function hasBody (props: MessageBoxProps) {
  return props.message !== undefined
}

function body (message: string) {
  if (message === undefined) return null
  return <div className="vc-text-[16pt] vc-text-[#212733] vc-whitespace-pre-wrap vc-mb-6">
    {message}
</div>
}

function hasInfo (props: MessageBoxProps) {
  return props.file !== undefined || props.url !== undefined
}

function infoPair (label: string, value: string) {
  if (label === undefined || value === undefined) return null
  return <div className="vc-flex vc-flex-col vc-mb-4">
  <label className="vc-text-[12pt] vc-text-[#787C83] vc-mb-1">
    {label}:
  </label>
  <input type="text" value={value} readOnly onFocus={(e) => e.stopPropagation()} className="vc-p-0.5 vc-border vc-border-gray-200 vc-rounded-md vc-bg-[#F8F9FA] vc-text-[11pt] vc-text-[#A0A3A8]"
  />
</div>
}

function hasFooter (props: MessageBoxProps) {
  return props.footer !== undefined && props.link !== undefined
}

function footer (linkText: string, linkHref: string) {
  if (linkText === undefined && linkHref === undefined) return null
  return <div className="vc-flex vc-justify-start vc-text-[#787C83]">
    {linkText}
    {linkHref !== undefined && (
      <a href={linkHref} className="vc-text-[12.8pt] vc-ml-1 vc-text-[#0078D4]">
      (link)
      </a>
    )}
  </div>
}

function divider () {
  return <div className="vc-border-b vc-border-[#DFDFE1] vc-mb-6"></div>
}

export default MessageBox
