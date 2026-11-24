import { Stack } from '@chakra-ui/react'
import { useState } from 'react'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import {
  buildNinetyNineDartsHitCards,
  buildNinetyNineDartsSummaryCards,
  emptyNinetyNineDartsGroup,
  getNinetyNineDartsGroupLabel,
} from '../../lib/profile/profileCards'
import type { NinetyNineDartsGroupInput, ProfileBestSource } from '../../lib/profile/profileCards'
import { StatsVariantToggle } from '../StatsPageSections/StatsVariantToggle'
import { ProfileModeSection } from './ProfileModeSection'
import { ProfileStatCardGrid } from './ProfileStatCardGrid'

export interface NinetyNineDartsProfileSectionProps {
  groups: NinetyNineDartsGroupInput[]
  /** Own profile can switch target. Other profiles stay on 20. */
  selectable?: boolean
  onStatSelect?: (selection: StatTimelineSelection) => void
  onOpenBest?: (source: ProfileBestSource) => void
}

const resolveActiveGroup = (
  selectable: boolean,
  playedGroups: NinetyNineDartsGroupInput[],
  selectedGroup: NinetyNineDartsStatGroup,
): NinetyNineDartsStatGroup => {
  if (!selectable) {
    return NinetyNineDartsStatGroup.Twenty
  }

  if (playedGroups.some((group) => group.group === selectedGroup)) {
    return selectedGroup
  }

  return playedGroups[0]?.group ?? NinetyNineDartsStatGroup.Twenty
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
  onOpenBest,
}: NinetyNineDartsProfileSectionProps) => {
  const playedGroups = groups.filter((group) => group.sessionCount > 0)
  const [selectedGroup, setSelectedGroup] = useState(NinetyNineDartsStatGroup.Twenty)
  const activeGroup = resolveActiveGroup(selectable, playedGroups, selectedGroup)
  const selected =
    groups.find((candidate) => candidate.group === activeGroup) ??
    emptyNinetyNineDartsGroup(activeGroup)
  const toggleGroups = selectable ? playedGroups : [selected]

  return (
    <ProfileModeSection
      title="99 Darts"
      trailing={
        <StatsVariantToggle
          items={toggleGroups.map((group) => ({
            value: group.group,
            label: getNinetyNineDartsGroupLabel(group.group),
            count: group.sessionCount,
          }))}
          value={activeGroup}
          onChange={(value) => {
            if (!selectable) {
              return
            }

            const next = parseGroup(value)
            if (next !== null) {
              setSelectedGroup(next)
            }
          }}
        />
      }
    >
      <Stack gap={3}>
        <ProfileStatCardGrid
          cards={buildNinetyNineDartsSummaryCards(selected)}
          empty={selected.sessionCount === 0}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
        <ProfileStatCardGrid
          cards={buildNinetyNineDartsHitCards(selected)}
          empty={selected.sessionCount === 0}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      </Stack>
    </ProfileModeSection>
  )
}
