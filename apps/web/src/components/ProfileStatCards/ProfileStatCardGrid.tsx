import { SimpleGrid } from '@chakra-ui/react'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import type { ProfileStatCardModel } from '../../lib/profile/profileCards'
import { ProfileStatCard } from './ProfileStatCard'

export interface ProfileStatCardGridProps {
  cards: ProfileStatCardModel[]
  empty?: boolean
  onStatSelect?: (selection: StatTimelineSelection) => void
}

export const ProfileStatCardGrid = ({
  cards,
  empty = false,
  onStatSelect,
}: ProfileStatCardGridProps) => (
  <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
    {cards.map((card) => (
      <ProfileStatCard key={card.id} card={card} empty={empty} onStatSelect={onStatSelect} />
    ))}
  </SimpleGrid>
)
