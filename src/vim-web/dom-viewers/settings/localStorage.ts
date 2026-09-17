let available = true

export function disableLocalStorage() {
  available = false
}

export function storageGet(key: string): string | null {
  if (!available) return null
  try {
    return localStorage.getItem(key)
  } catch {
    available = false
    console.warn('localStorage is unavailable')
    return null
  }
}

export function storageSet(key: string, value: string) {
  if (!available) return
  try {
    localStorage.setItem(key, value)
  } catch {
    available = false
    console.warn('localStorage is unavailable')
  }
}
