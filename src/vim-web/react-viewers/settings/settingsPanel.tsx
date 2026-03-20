import { GenericEntryType, GenericContent } from '../generic/genericField'

export function SettingsPanel(props: {
  content: GenericEntryType[]
  visible: boolean
}) {
  if (!props.visible) return null

  return (
    <div className="vim-settings-panel">
      <div className="vim-panel-header">
        <span className="vim-panel-title">Settings</span>
      </div>
      <div className="vim-panel-body">
        <GenericContent items={props.content} />
      </div>
    </div>
  )
}
