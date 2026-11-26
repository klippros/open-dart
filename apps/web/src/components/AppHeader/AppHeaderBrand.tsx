import { HStack, Link } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../../hooks/authContext'
import { useGameChrome } from '../../hooks/gameChromeContext'
import { AuthStatus } from '../../types/auth'
import { GameLeaveControl } from '../GameLeaveControl/GameLeaveControl'

/** Left-side brand row; during a match, replaced by the leave control. */
export const AppHeaderBrand = () => {
  const gameChrome = useGameChrome()
  const { authStatus, user } = useAuth()
  const showMatchControls = gameChrome?.active === true
  const signedIn = authStatus === AuthStatus.Authenticated && user !== null
  const brandTo = signedIn ? '/play' : '/'

  if (showMatchControls) {
    return (
      <HStack flex="1" gap={1} align="center" minW={0}>
        <GameLeaveControl />
      </HStack>
    )
  }

  return (
    <HStack flex="1" gap={5} align="center" minW={0}>
      <Link asChild display="flex" alignItems="center" flexShrink={0} h="56px">
        <RouterLink to={brandTo} aria-label={signedIn ? 'Open Dart play' : 'Open Dart home'}>
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Open Dart"
            style={{ height: '56px', width: 'auto', display: 'block' }}
          />
        </RouterLink>
      </Link>
    </HStack>
  )
}
