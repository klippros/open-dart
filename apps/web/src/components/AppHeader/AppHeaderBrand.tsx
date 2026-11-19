import { HStack, Link } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useGameChrome } from '../../hooks/gameChromeContext'
import { GameLeaveControl } from '../GameLeaveControl/GameLeaveControl'

/** Left-side brand row; during a match, replaced by the leave control. */
export const AppHeaderBrand = () => {
  const gameChrome = useGameChrome()
  const showMatchControls = gameChrome?.active === true

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
        <RouterLink to="/" aria-label="Open Dart home">
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
