import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import type { ProfileBestSource, ProfileStatCardModel } from '../../lib/profile/profileCards'
import { StatsCountLabel } from './StatsCountLabel'
import { ProfileModeSection } from './ProfileModeSection'
import { ProfileStatCardGrid } from './ProfileStatCardGrid'

export interface ProfileCardsSectionProps {
  title: string
  cards: ProfileStatCardModel[]
  empty?: boolean
  /** Shown in the header when the section has no variant selector. */
  sessionCount?: number
  /** Cards per row at every width. */
  columns?: number
  onStatSelect?: (selection: StatTimelineSelection) => void
  onOpenBest?: (source: ProfileBestSource) => void
}

export const ProfileCardsSection = ({
  title,
  cards,
  empty = false,
  sessionCount,
  columns,
  onStatSelect,
  onOpenBest,
}: ProfileCardsSectionProps) => (
  <ProfileModeSection
    title={title}
    trailing={sessionCount === undefined ? undefined : <StatsCountLabel count={sessionCount} />}
  >
    <ProfileStatCardGrid
      cards={cards}
      empty={empty}
      columns={columns}
      onStatSelect={onStatSelect}
      onOpenBest={onOpenBest}
    />
  </ProfileModeSection>
)
