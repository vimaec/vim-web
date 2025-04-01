export const controlBarButtonStyle = 'vim-control-bar-button vc-rounded-full vc-items-center vc-justify-center vc-flex vc-transition-all hover:vc-scale-110'
export function buttonDefaultStyle (on: boolean) {
  return on
    ? controlBarButtonStyle + ' vc-text-primary'
    : controlBarButtonStyle + ' vc-text-gray-medium'
}

export function buttonExpandStyle (on: boolean) {
  return on
    ? controlBarButtonStyle + ' vc-text-white vc-bg-primary'
    : controlBarButtonStyle + ' vc-text-gray-medium'
}

export function buttonDisableStyle (on: boolean) {
  return on
    ? controlBarButtonStyle + ' vc-text-gray-medium'
    : controlBarButtonStyle + ' vc-text-gray vc-pointer-events-none'
}

export function buttonDisableDefaultStyle (on: boolean) {
  return on
    ? controlBarButtonStyle + ' vc-text-primary'
    : controlBarButtonStyle + ' vc-text-gray vc-pointer-events-none'
}

export function buttonBlueStyle (on: boolean) {
  return controlBarButtonStyle + ' vc-text-white'
}

export interface IControlBarButtonItem {
  id: string,
  enabled?: (() => boolean) | undefined
  tip: string
  action: () => void
  icon: ({ height, width, fill, className }) => JSX.Element
  isOn?: () => boolean
  style?: (on: boolean) => string
}

export interface IControlBarCounter extends IControlBarButtonItem {
  count: () => number
}

export function isControlBarButtonItem(button: any): button is IControlBarButtonItem {
  return (
    button !== null &&
    typeof button === "object" &&
    typeof button.id === "string" &&
    typeof button.tip === "string" &&
    typeof button.action === "function" &&
    typeof button.icon === "function" &&
    (button.enabled === undefined || typeof button.enabled === "function") &&
    (button.isOn === undefined || typeof button.isOn === "function") &&
    (button.style === undefined || typeof button.style === "function")
  );
}

export function isControlBarCounter(button: any): button is IControlBarCounter {
  return (
    isControlBarButtonItem(button) &&
    typeof (button as IControlBarCounter).count === "function"
  );
}


export function createButton (button: IControlBarButtonItem) {
  if (button.enabled !== undefined && !button.enabled()) return null
  const style = (button.style?? buttonDefaultStyle)(button.isOn?.())

  return (
    <button key={button.id} id={button.id} data-tip={button.tip} onClick={button.action} className={style} type="button">
      {button.icon({ height: '20', width: '20', fill: 'currentColor', className: 'vc-max-h-[80%]' })}
    </button>
  )
}

export function createCounter(button: IControlBarCounter) {
  const count = button.count()
  const countId = `${button.id}-count`
  return <div
    className={`${button.id} vc-relative vc-flex vc-items-center vc-justify-center`}
    key={button.id}
  >
    {createButton(button)}
    {/* Count Span */}
    {count > 0 && (
    <span
      key={countId}
      className={`
        vim-control-bar-counter
        vc-text-gray-medium
        vc-flex vc-flex-col vc-self-end
        vc-text-xs
        vc-font-semibold
        vc-pointer-events-none
      `}
    >
      {count}
    </span>
    )}
  </div>
}
