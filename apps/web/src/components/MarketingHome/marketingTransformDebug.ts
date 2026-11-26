const STORAGE_KEY = 'open-dart:marketing-transform-tweaker'
const CHANGE_EVENT = 'open-dart:marketing-transform-tweaker'

interface MarketingTransformDebugApi {
  enable: () => void
  disable: () => void
  isEnabled: () => boolean
}

declare global {
  interface Window {
    openDartMarketingTransform?: MarketingTransformDebugApi
  }
}

export const isMarketingTransformTweakerEnabled = (): boolean => {
  if (!import.meta.env.DEV) {
    return false
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const setEnabled = (enabled: boolean): void => {
  if (!import.meta.env.DEV) {
    return
  }

  try {
    if (enabled) {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Ignore storage failures in private mode.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const subscribeMarketingTransformTweaker = (onChange: () => void): (() => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      onChange()
    }
  }

  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', handleStorage)
  }
}

/** DEV console: `openDartMarketingTransform.enable()` / `.disable()` */
if (import.meta.env.DEV) {
  window.openDartMarketingTransform = {
    enable: () => {
      setEnabled(true)
      console.info('[open-dart] 3D transform tweaker enabled')
    },
    disable: () => {
      setEnabled(false)
      console.info('[open-dart] 3D transform tweaker disabled')
    },
    isEnabled: isMarketingTransformTweakerEnabled,
  }
}
