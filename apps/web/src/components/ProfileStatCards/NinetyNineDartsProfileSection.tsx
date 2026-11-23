import { Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import {
  buildNinetyNineDartsHitCards,
  buildNinetyNineDartsSummaryCards,
  emptyNinetyNineDartsGroup,
  getNinetyNineDartsGroupLabel,
} from '../../lib/profile/profileCards'
import type { NinetyNineDartsGroupInput } from '../../lib/profile/profileCards'
import { StatsVariantToggle } from '../StatsPageSections/StatsVariantToggle'
import { ProfileModeSection } from './ProfileModeSection'
import { ProfileStatCardGrid } from './ProfileStatCardGrid'

export interface NinetyNineDartsProfileSectionProps {
  groups: NinetyNineDartsGroupInput[]
  /** Own profile can switch target. Other profiles stay on 20. */
  selectable?: boolean
  onStatSelect?: (selection: StatTimelineSelection) => void
}

const parseGroup = (value: string): NinetyNineDartsStatGroup | null => {
  switch (value) {
    case '20':
      return NinetyNineDartsStatGroup.Twenty
    case 'bull':
      return NinetyNineDartsStatGroup.Bull
    case 'other':
      return NinetyNineDartsStatGroup.Other
    default:
      return null
  }
}

export const NinetyNineDartsProfileSection = ({
  groups,
  selectable = false,
  onStatSelect,
}: NinetyNineDartsProfileSectionProps) => {
  const [selectedGroup, setSelectedGroup] = useState(NinetyNineDartsStatGroup.Twenty)
  const activeGroup = selectable ? selectedGroup : NinetyNineDartsStatGroup.Twenty
  const selected =
    groups.find((candidate) => candidate.group === activeGroup) ??
    emptyNinetyNineDartsGroup(activeGroup)

  return (
    <ProfileModeSection
      title="99 Darts"
      trailing={
        selectable ? (
          <StatsVariantToggle
            items={groups.map((group) => ({
              value: group.group,
              label: getNinetyNineDartsGroupLabel(group.group),
              count: group.sessionCount,
            }))}
            value={activeGroup}
            onChange={(value) => {
              const next = parseGroup(value)
              if (next !== null) {
                setSelectedGroup(next)
              }
            }}
          />
        ) : undefined
      }
    >
      <Stack gap={3}>
        {selectable ? null : (
          <Text fontSize="sm" color="whiteAlpha.700">
            On 20
          </Text>
        )}
        <ProfileStatCardGrid
          cards={buildNinetyNineDartsSummaryCards(selected)}
          empty={selected.sessionCount === 0}
          maxColumns={5}
          onStatSelect={onStatSelect}
        />
        <ProfileStatCardGrid
          cards={buildNinetyNineDartsHitCards(selected)}
          empty={selected.sessionCount === 0}
          onStatSelect={onStatSelect}
        />
      </Stack>
    </ProfileModeSection>
  )
}
