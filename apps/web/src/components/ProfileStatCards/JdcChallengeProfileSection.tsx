import { Stack } from '@chakra-ui/react'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import {
  buildJdcChallengeSegmentCards,
  buildJdcChallengeSummaryCards,
} from '../../lib/profile/profileCards'
import type { JdcChallengeSummaryInput, ProfileBestSource } from '../../lib/profile/profileCards'
import { StatsCountLabel } from '../StatsPageSections/StatsCountLabel'
import { ProfileModeSection } from './ProfileModeSection'
import { ProfileStatCardGrid } from './ProfileStatCardGrid'

export interface JdcChallengeProfileSectionProps {
  stats: JdcChallengeSummaryInput
  onStatSelect?: (selection: StatTimelineSelection) => void
  onOpenBest?: (source: ProfileBestSource) => void
}

export const JdcChallengeProfileSection = ({
  stats,
  onStatSelect,
  onOpenBest,
}: JdcChallengeProfileSectionProps) => {
  const empty = stats.sessionCount === 0

  return (
    <ProfileModeSection
      title="JDC Challenge"
      trailing={<StatsCountLabel count={stats.sessionCount} />}
    >
      <Stack gap={3}>
        <ProfileStatCardGrid
          cards={buildJdcChallengeSummaryCards(stats)}
          empty={empty}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
        <ProfileStatCardGrid
          cards={buildJdcChallengeSegmentCards(stats)}
          empty={empty}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      </Stack>
    </ProfileModeSection>
  )
}
