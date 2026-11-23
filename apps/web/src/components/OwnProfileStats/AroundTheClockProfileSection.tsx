import { Box, Stack } from '@chakra-ui/react'
import type { AroundTheClockPracticeStats } from '@open-dart/analytics/computeAnalytics'
import { getAroundTheClockAimModeLabel } from '@open-dart/game/aroundTheClock/aroundTheClockConfig'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import { buildAroundTheClockCards } from '../../lib/profile/profileCards'
import { ProfileModeSection } from '../ProfileStatCards/ProfileModeSection'
import { ProfileStatCardGrid } from '../ProfileStatCards/ProfileStatCardGrid'
import { AroundTheClockHeatmap } from '../StatsPageSections/AroundTheClockHeatmap/AroundTheClockHeatmap'
import { StatsVariantToggle } from '../StatsPageSections/StatsVariantToggle'
import { useLastPlayedVariantSelection } from '../StatsPageSections/useLastPlayedVariantSelection'
import { ProfileDisclosure } from './ProfileDisclosure'

export interface AroundTheClockProfileSectionProps {
  variants: AroundTheClockPracticeStats[]
  onStatSelect: (selection: StatTimelineSelection) => void
}

const getVariantKey = (stats: AroundTheClockPracticeStats): string => stats.aimMode
const getLastPlayedAt = (stats: AroundTheClockPracticeStats): string => stats.lastPlayedAt

export const AroundTheClockProfileSection = ({
  variants,
  onStatSelect,
}: AroundTheClockProfileSectionProps) => {
  const { selectedKey, setSelectedKey, selected } = useLastPlayedVariantSelection(
    variants,
    getVariantKey,
    getLastPlayedAt,
  )

  if (selected === undefined) {
    return null
  }

  return (
    <ProfileModeSection
      title="Around the Clock"
      trailing={
        <StatsVariantToggle
          items={variants.map((stats) => ({
            value: stats.aimMode,
            label: getAroundTheClockAimModeLabel(stats.aimMode),
            count: stats.gameCount,
          }))}
          value={selectedKey}
          onChange={setSelectedKey}
        />
      }
    >
      <Stack gap={3}>
        <ProfileStatCardGrid
          cards={buildAroundTheClockCards(selected)}
          onStatSelect={onStatSelect}
        />
        <ProfileDisclosure label="Heatmap">
          <Box pt={2}>
            <AroundTheClockHeatmap targets={selected.targets} />
          </Box>
        </ProfileDisclosure>
      </Stack>
    </ProfileModeSection>
  )
}
