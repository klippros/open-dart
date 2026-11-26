import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearAllowHome, hasAllowHome, markAllowHome } from './homeEntry'

describe('homeEntry', () => {
  const storage = new Map<string, string>()

  beforeEach(() => {
    storage.clear()
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value)
        },
        removeItem: (key: string) => {
          storage.delete(key)
        },
        clear: () => {
          storage.clear()
        },
      },
      configurable: true,
    })
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'sessionStorage')
  })

  it('starts without allow-home', () => {
    expect(hasAllowHome()).toBe(false)
  })

  it('marks and clears allow-home in sessionStorage', () => {
    markAllowHome()
    expect(hasAllowHome()).toBe(true)
    clearAllowHome()
    expect(hasAllowHome()).toBe(false)
  })
})
