import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import type { ProfileStatCardModel } from '../../lib/profile/profileCards'
import { ProfileModeSection } from './ProfileModeSection'
import { ProfileStatCardGrid } from './ProfileStatCardGrid'

export interface ProfileCardsSectionProps {
  title: string
  cards: ProfileStatCardModel[]
  empty?: boolean
  onStatSelect?: (selection: StatTimelineSelection) => void
}

export const ProfileCardsSection = ({
  title,
  cards,
  empty = false,
  onStatSelect,
}: ProfileCardsSectionProps) => (
  <ProfileModeSection title={title}>
    <ProfileStatCardGrid cards={cards} empty={empty} onStatSelect={onStatSelect} />
  </ProfileModeSection>
)
