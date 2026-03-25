import React from 'react'

export type MessageBoxProps = {
  title: string;
  body: string | React.ReactElement;
  icon?: React.ReactElement
  footer?: string | React.ReactElement;
  canClose?: boolean;
  minimize?: boolean;
  onClose?: () => void;
}

export type MessageBoxPropsTyped = MessageBoxProps & {
  type: 'message'
}

export function MessageBox (props: {value: MessageBoxProps}) {
  const [minimized, setMinimized] = React.useState(props.value.minimize ?? false)

  const p = props.value
  if (!p.title || !p.body) return null
  return (
    <div className="vim-message-box">
      <div className="vim-message-box-header">
        {props.value.icon}
        {title(p.title)}
        {props.value.canClose && closeBtn(p.onClose)}
        {props.value.minimize && minimizeButton(minimized, setMinimized)}
      </div>

      {!minimized && <hr className="vim-divider" />}
      {!minimized && body(p.body)}
      {!minimized && footer(p.footer)}
    </div>
  )
}

function title (title: string) {
  return <h2 className="vim-message-box-title">{title}</h2>
}

function closeBtn (onClose: () => void) {
  if (!onClose) return null
  return <button onClick={onClose} data-tip="Close" className="vim-message-box-btn">&times;</button>
}

function minimizeButton (minimized: boolean, setMinimized: (value:boolean) => void) {
  return <button onClick={() => setMinimized(!minimized)} data-tip={minimized ? 'Expand' : 'Minimize'} className="vim-message-box-btn">
    { minimized
     ? <span>&#9660;</span>
     : <span>&#9650;</span>
    }
  </button>
}

function body (content: string | React.ReactElement) {
  if (content === undefined) return null
  if (typeof content === 'string') {
    return <div className="vim-message-box-body">{content}</div>
  }
  return content
}

function footer (content: string | React.ReactElement) {
  if (content === undefined) return null
  return <div className="vim-footer">{content}</div>
}
