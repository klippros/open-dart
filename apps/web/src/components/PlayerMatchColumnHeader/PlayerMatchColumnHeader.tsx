import { Box, Flex } from '@chakra-ui/react'
import { faTrophy } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LegStarterIcon } from '../LegStarterIcon/LegStarterIcon'
import { TruncatedName } from '../TruncatedName/TruncatedName'

export interface PlayerMatchColumnHeaderProps {
  name: string
  showTrophy?: boolean
  showLegStarter?: boolean
}

export const PlayerMatchColumnHeader = ({
  name,
  showTrophy = false,
  showLegStarter = false,
}: PlayerMatchColumnHeaderProps) => (
  <Flex align="center" gap={1.5} justify="flex-end" minW={0} w="full">
    {showTrophy && (
      <Box flexShrink={0} lineHeight={0}>
        <FontAwesomeIcon icon={faTrophy} aria-hidden />
      </Box>
    )}
    <TruncatedName name={name} fontSize="sm" color="whiteAlpha.700" textAlign="right" />
    {showLegStarter && <LegStarterIcon direction="left" />}
  </Flex>
)
