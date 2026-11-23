import { Flex, Stack, Text } from '@chakra-ui/react'
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
  onStatSelect,
}: NinetyNineDartsProfileSectionProps) => {
  const [selectedGroup, setSelectedGroup] = useState(NinetyNineDartsStatGroup.Twenty)
  const findGroup = (group: NinetyNineDartsStatGroup) =>
    groups.find((candidate) => candidate.group === group) ?? emptyNinetyNineDartsGroup(group)
  const twenty = findGroup(NinetyNineDartsStatGroup.Twenty)
  const selected = findGroup(selectedGroup)

  return (
    <ProfileModeSection title="99 Darts">
      <Stack gap={3}>
        <Text fontSize="sm" color="whiteAlpha.700">
          On 20
        </Text>
        <ProfileStatCardGrid
          cards={buildNinetyNineDartsSummaryCards(twenty)}
          empty={twenty.sessionCount === 0}
          onStatSelect={onStatSelect}
        />
        <Flex justify="space-between" align="center" gap={3} flexWrap="wrap" pt={1}>
          <Text fontSize="sm" color="whiteAlpha.700">
            Hits per game
          </Text>
          <StatsVariantToggle
            items={groups.map((group) => ({
              value: group.group,
              label: getNinetyNineDartsGroupLabel(group.group),
              count: group.sessionCount,
            }))}
            value={selectedGroup}
            onChange={(value) => {
              const next = parseGroup(value)
              if (next !== null) {
                setSelectedGroup(next)
              }
            }}
          />
        </Flex>
        <ProfileStatCardGrid
          cards={buildNinetyNineDartsHitCards(selected)}
          empty={selected.sessionCount === 0}
          onStatSelect={onStatSelect}
        />
      </Stack>
    </ProfileModeSection>
  )
}
