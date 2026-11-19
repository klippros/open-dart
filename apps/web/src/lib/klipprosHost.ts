import { AuthStatus } from '../types/auth'

export const OPEN_DART_APP_URL = 'https://opendart.app/'

export const readBrowserHostname = (): string =>
  typeof window === 'undefined' ? '' : window.location.hostname

export const isKlipprosHost = (hostname: string): boolean =>
  hostname === 'klippros.com' || hostname === 'www.klippros.com'

export const isOpenDartHost = (hostname: string): boolean =>
  hostname === 'opendart.app' || hostname === 'www.opendart.app'

/** Local and online play screens. Setup and home stay outside this set. */
export const isLegacyPlayRoute = (pathname: string): boolean =>
  pathname === '/game' || (/^\/match\/[^/]+$/u.test(pathname) && pathname !== '/match/new')

export const isSignInEnabled = !isKlipprosHost(readBrowserHostname())

export const shouldRedirectKlipprosSignedInUser = (
  hostname: string,
  authStatus: AuthStatus,
  pathname: string,
): boolean =>
  isKlipprosHost(hostname) &&
  authStatus === AuthStatus.Authenticated &&
  !isLegacyPlayRoute(pathname)
