/**
 * Dialog contracts — the same shapes as the React layer's `ModalApi` /
 * `ModalProps`, except that content slots take DOM (`Element`), not JSX.
 * `webgl/loading.ts` and `ultra/modal.tsx` drive `ModalApi` unchanged.
 */
export type ProgressMode = 'percent' | 'bytes'

export type LoadingBoxProps = {
  message?: string
  /** Bytes in `bytes` mode, 0–100 in `percent` mode. */
  progress?: number
  mode?: ProgressMode
  more?: Element | string
}

export type MessageBoxProps = {
  title: string
  body: string | Element
  icon?: Element
  footer?: string | Element
  canClose?: boolean
  minimize?: boolean
  onClose?: () => void
}

export type ModalProps = (
  | (MessageBoxProps & { type: 'message' })
  | (LoadingBoxProps & { type: 'loading' })
  | { type: 'help' }
) & {
  canClose?: boolean
  onClose?: () => void
}

export type ModalApi = {
  getActiveState (): ModalProps | undefined
  loading (content: LoadingBoxProps | undefined): void
  message (content: MessageBoxProps | undefined): void
  help (show: boolean): void
}
