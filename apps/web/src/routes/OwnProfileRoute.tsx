import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/authContext'
import { getOwnProfilePath } from '../lib/profile/profileRoutes'
import { AuthStatus } from '../types/auth'
import { ProfilePage } from './ProfilePage'

export const OwnProfileRoute = () => {
  const { authStatus, user } = useAuth()

  if (authStatus === AuthStatus.Loading) {
    return null
  }

  if (authStatus === AuthStatus.Authenticated && user !== null) {
    return <Navigate to={getOwnProfilePath(user.id)} replace />
  }

  return <ProfilePage />
}
