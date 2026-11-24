import { describe, expect, it } from 'vitest'
import {
  LEGACY_PROFILE_PATHS,
  OWN_PROFILE_PATH,
  getOwnProfilePath,
  getPlayerProfilePath,
  isOwnProfileUserId,
} from './profileRoutes'

describe('profileRoutes', () => {
  it('builds player profile links', () => {
    expect(getPlayerProfilePath('abc')).toBe('/players/abc')
  })

  it('keeps signed-out users on the profile path and signed-in users on a player link', () => {
    expect(getOwnProfilePath(null)).toBe('/profile')
    expect(getOwnProfilePath(undefined)).toBe('/profile')
    expect(getOwnProfilePath('')).toBe('/profile')
    expect(getOwnProfilePath('abc')).toBe('/players/abc')
  })

  it('keeps the legacy history and stats paths for redirects', () => {
    expect(LEGACY_PROFILE_PATHS).toEqual(['/history', '/stats'])
    expect(OWN_PROFILE_PATH).toBe('/profile')
  })

  it('treats the viewer id as the own profile', () => {
    expect(isOwnProfileUserId('user-a', 'user-a')).toBe(true)
    expect(isOwnProfileUserId('user-a', 'user-b')).toBe(false)
    expect(isOwnProfileUserId('user-a', null)).toBe(false)
    expect(isOwnProfileUserId(undefined, 'user-a')).toBe(false)
  })
})
