import { Box, Flex } from '@chakra-ui/react'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import type { ProfileStatCardModel } from '../../lib/profile/profileCards'
import { ProfileStatCard } from './ProfileStatCard'

export interface ProfileStatCardGridProps {
  cards: ProfileStatCardModel[]
  empty?: boolean
  /** Widest row on medium screens. Fewer cards still grow to fill the row. */
  maxColumns?: number
  onStatSelect?: (selection: StatTimelineSelection) => void
}

export const ProfileStatCardGrid = ({
  cards,
  empty = false,
  maxColumns = 4,
  onStatSelect,
}: ProfileStatCardGridProps) => (
  <Flex wrap="wrap" gap={3}>
    {cards.map((card) => (
      <Box
        key={card.id}
        display="flex"
        minW={0}
        flex={{
          base: '1 1 calc(50% - 0.75rem)',
          md: `1 1 calc(${100 / maxColumns}% - 0.75rem)`,
        }}
      >
        <ProfileStatCard card={card} empty={empty} onStatSelect={onStatSelect} />
      </Box>
    ))}
  </Flex>
)
