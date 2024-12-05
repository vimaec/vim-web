import { useState } from 'react'

// Open state is kept here to persist between panel open/close.
// New dictionaries are created all the time to trigger rerender on setOpen.
export function createOpenState () {
  const [open, setOpen] = useState<Map<string, boolean>>()

  const update = (group: string, value: boolean) => {
    const next = new Map(open?.entries() ?? []).set(group, value)
    setOpen(next)
  }

  const init = (keys: string[]) => {
    const map = new Map(open?.entries() ?? [])
    keys.forEach((k) => {
      if (!map.has(k)) map.set(k, true)
    })
    setOpen(map)
  }

  const get = (s: string) => open?.get(s) ?? false

  return { init, get, set: update }
}
