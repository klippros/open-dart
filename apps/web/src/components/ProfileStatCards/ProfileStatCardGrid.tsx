import { Box, Flex } from '@chakra-ui/react'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import type { ProfileBestSource, ProfileStatCardModel } from '../../lib/profile/profileCards'
import { ProfileStatCard } from './ProfileStatCard'

export interface ProfileStatCardGridProps {
  cards: ProfileStatCardModel[]
  empty?: boolean
  /** Widest row on medium screens. Fewer cards still grow to fill the row. */
  maxColumns?: number
  /** Cards per row at every width. Overrides the responsive column count. */
  columns?: number
  onStatSelect?: (selection: StatTimelineSelection) => void
  onOpenBest?: (source: ProfileBestSource) => void
}

const columnBasis = (count: number): string => `1 1 calc(${100 / count}% - 0.75rem)`

export const ProfileStatCardGrid = ({
  cards,
  empty = false,
  maxColumns = 4,
  columns,
  onStatSelect,
  onOpenBest,
}: ProfileStatCardGridProps) => (
  <Flex wrap="wrap" gap={3}>
    {cards.map((card) => (
      <Box
        key={card.id}
        display="flex"
        minW={0}
        flex={
          columns === undefined
            ? { base: '1 1 calc(50% - 0.75rem)', md: columnBasis(maxColumns) }
            : columnBasis(columns)
        }
      >
        <ProfileStatCard
          card={card}
          empty={empty}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      </Box>
    ))}
  </Flex>
)
