import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/authContext'
import {
  OPEN_DART_APP_URL,
  readBrowserHostname,
  shouldRedirectKlipprosSignedInUser,
} from '../../lib/klipprosHost'

export const KlipprosSignedInRedirect = () => {
  const { authStatus } = useAuth()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!shouldRedirectKlipprosSignedInUser(readBrowserHostname(), authStatus, pathname)) {
      return
    }

    window.location.replace(OPEN_DART_APP_URL)
  }, [authStatus, pathname])

  return null
}
