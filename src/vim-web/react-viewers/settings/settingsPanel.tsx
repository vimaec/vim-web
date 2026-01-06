/**
 * @module viw-webgl-react
 */

import React from 'react'
import { SettingsState } from './settingsState'
import { renderSettingsInputBox } from './settingsInputBox'
import { renderSettingsToggle } from './settingsToggle'
import { SettingsItem } from './settingsItem'
import { renderSettingsSubtitle } from './settingsSubtitle'
import { AnySettings } from './anySettings'

/**
 * JSX Component to interact with settings.
 * @param viewer current viewer
 * @param settings setting state
 * @param visible will return null if this is false.
 * @returns
 */
export function SettingsPanel<T extends AnySettings>(props: {
  content: SettingsItem<T>[]
  settings: SettingsState<T>
  visible: boolean
}) {
  if (!props.visible) return null

  function renderItem<T extends AnySettings>(
    settings: SettingsState<T>,
    item: SettingsItem<T>,
  ): JSX.Element | null {
    return (
      <React.Fragment key={item.key}>
        {(() => {
          switch (item.type) {
            case 'subtitle': return renderSettingsSubtitle(item)
            case 'toggle':   return renderSettingsToggle(settings, item)
            case 'box':      return renderSettingsInputBox(settings, item)
            case 'element':  return item.element
            default: return null
          }
        })()}
      </React.Fragment>
    )
  }

  const customizer = props.settings.customizer.get()
  const content = customizer ? customizer(props.content) : props.content

  const sections = buildSections(content)

  return (
    <div className="vc-absolute vc-inset-0">
      {/* CHANGED: add bottom margin so title sits a bit away from the list */}
      <h3 className="vc-title vc-mb-2">Settings</h3>

      {/* CHANGED: add padding + vertical spacing between sections */}
      <div className="
        vim-settings
        vc-absolute vc-top-8 vc-left-0 vc-right-0 vc-bottom-0
        vc-overflow-y-auto
        vc-pr-2
        vc-space-y-2
        vc-box-border
      ">
        {sections.map(section => (
          <details
            key={section.key}
            open
            /* CHANGED: make each section look like a card */
            className="
              vim-settings-section
              vc-bg-white
              vc-rounded-md
              vc-shadow-sm
              vc-border
              vc-border-slate-200
              vc-p-2
              vc-space-y-2
            "
          >
            {/* CHANGED: slightly bolder title + clickable cursor */}
            <summary className="vim-settings-section-title vc-font-medium vc-text-sm vc-cursor-pointer">
              {section.title}
            </summary>

            {/* CHANGED: add spacing between items inside each card */}
            <div className="vim-settings-section-content vc-mt-2 vc-space-y-2">
              {section.items.map(item =>
                renderItem<T>(props.settings, item),
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

type SettingsSection<T extends AnySettings> = {
  key: string
  title: string
  items: SettingsItem<T>[]
}

function buildSections<T extends AnySettings>(items: SettingsItem<T>[]): SettingsSection<T>[] {
  const sections: SettingsSection<T>[] = []
  let current: SettingsSection<T> | null = null

  for (const item of items) {
    if (item.type === 'subtitle') {
      current = {
        key: item.key,
        title: item.title,
        items: [],
      }
      sections.push(current)
    } else {
      if (!current) {
        // optional: items before the first subtitle
        current = {
          key: 'default',
          title: '',
          items: [],
        }
        sections.push(current)
      }
      current.items.push(item)
    }
  }

  return sections
}
