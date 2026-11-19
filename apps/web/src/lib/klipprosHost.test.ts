import { describe, expect, it } from 'vitest'
import { AuthStatus } from '../types/auth'
import {
  isKlipprosHost,
  isLegacyPlayRoute,
  isOpenDartHost,
  shouldRedirectKlipprosSignedInUser,
} from './klipprosHost'

describe('klipprosHost', () => {
  it('recognizes the klippros hosts', () => {
    expect(isKlipprosHost('klippros.com')).toBe(true)
    expect(isKlipprosHost('www.klippros.com')).toBe(true)
    expect(isKlipprosHost('opendart.app')).toBe(false)
    expect(isKlipprosHost('localhost')).toBe(false)
    expect(isOpenDartHost('opendart.app')).toBe(true)
    expect(isOpenDartHost('www.opendart.app')).toBe(true)
    expect(isOpenDartHost('klippros.com')).toBe(false)
  })

  it('treats a local game and an online match as play routes', () => {
    expect(isLegacyPlayRoute('/game')).toBe(true)
    expect(isLegacyPlayRoute('/match/abc')).toBe(true)
    expect(isLegacyPlayRoute('/match/new')).toBe(false)
    expect(isLegacyPlayRoute('/')).toBe(false)
    expect(isLegacyPlayRoute('/history')).toBe(false)
  })

  it('redirects a signed-in klippros visitor off a non-game page', () => {
    expect(shouldRedirectKlipprosSignedInUser('klippros.com', AuthStatus.Authenticated, '/')).toBe(
      true,
    )
    expect(
      shouldRedirectKlipprosSignedInUser('klippros.com', AuthStatus.Authenticated, '/history'),
    ).toBe(true)
    expect(
      shouldRedirectKlipprosSignedInUser('klippros.com', AuthStatus.Authenticated, '/game'),
    ).toBe(false)
    expect(
      shouldRedirectKlipprosSignedInUser('klippros.com', AuthStatus.Authenticated, '/match/abc'),
    ).toBe(false)
    expect(shouldRedirectKlipprosSignedInUser('klippros.com', AuthStatus.Anonymous, '/')).toBe(
      false,
    )
    expect(shouldRedirectKlipprosSignedInUser('klippros.com', AuthStatus.Loading, '/')).toBe(false)
    expect(shouldRedirectKlipprosSignedInUser('opendart.app', AuthStatus.Authenticated, '/')).toBe(
      false,
    )
  })
})
