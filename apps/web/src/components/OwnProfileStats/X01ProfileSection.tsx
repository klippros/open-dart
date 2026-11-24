import { HStack, Stack, Switch } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { computeX01Stats } from '@open-dart/analytics/x01Stats'
import type { X01StatsFilterId } from '@open-dart/analytics/x01Stats'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import type { ProfileBestSource } from '../../lib/profile/profileCards'
import {
  buildX01DetailRows,
  buildX01SummaryCards,
  x01SummaryFromLegStats,
} from '../../lib/profile/profileCards'
import {
  X01_PROFILE_VARIANTS,
  getX01VariantStats,
  parseX01ProfileVariant,
  pickDefaultX01Variant,
} from '../../lib/profile/x01ProfileFilter'
import { ProfileModeSection } from '../ProfileStatCards/ProfileModeSection'
import { ProfileStatCardGrid } from '../ProfileStatCards/ProfileStatCardGrid'
import { StatsVariantToggle } from '../ProfileStatCards/StatsVariantToggle'
import { ProfileDisclosure } from './ProfileDisclosure'
import { X01DetailTable } from './X01DetailTable'

export interface X01ProfileSectionProps {
  sessions: GameSession[]
  onStatSelect: (selection: StatTimelineSelection) => void
  onOpenBest?: (source: ProfileBestSource) => void
}

export const X01ProfileSection = ({
  sessions,
  onStatSelect,
  onOpenBest,
}: X01ProfileSectionProps) => {
  const [checkedOutOnly, setCheckedOutOnly] = useState(false)
  const [chosenVariant, setChosenVariant] = useState<X01StatsFilterId | null>(null)
  const allX01 = useMemo(() => computeX01Stats(sessions), [sessions])
  const x01 = useMemo(
    () => (checkedOutOnly ? computeX01Stats(sessions, { checkedOutOnly: true }) : allX01),
    [allX01, checkedOutOnly, sessions],
  )
  const selectedId = chosenVariant ?? pickDefaultX01Variant(allX01)
  const variant =
    X01_PROFILE_VARIANTS.find((candidate) => candidate.id === selectedId) ?? X01_PROFILE_VARIANTS[0]
  const stats = getX01VariantStats(x01, variant.id)
  const context = {
    scope: variant.scope,
    scopeLabel: checkedOutOnly ? `${variant.label} · checked out` : variant.label,
    checkedOutOnly,
  }
  const empty = stats.legCount === 0

  return (
    <ProfileModeSection
      title="x01"
      trailing={
        <HStack gap={3} flexWrap="wrap" justify="flex-end">
          <Switch.Root
            size="sm"
            checked={checkedOutOnly}
            colorPalette="orange"
            display="flex"
            alignItems="center"
            gap={3}
            onCheckedChange={(details) => {
              setCheckedOutOnly(details.checked)
            }}
          >
            <Switch.Label fontSize="sm" color="whiteAlpha.800" fontWeight="normal">
              Only checked out
            </Switch.Label>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
          <StatsVariantToggle
            items={X01_PROFILE_VARIANTS.map((candidate) => ({
              value: candidate.id,
              label: candidate.label,
              count: getX01VariantStats(x01, candidate.id).legCount,
            }))}
            value={variant.id}
            onChange={(value) => {
              const next = parseX01ProfileVariant(value)
              if (next !== null) {
                setChosenVariant(next)
              }
            }}
          />
        </HStack>
      }
    >
      <Stack gap={3}>
        <ProfileStatCardGrid
          cards={buildX01SummaryCards(x01SummaryFromLegStats(stats), context)}
          empty={empty}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
        {empty ? null : (
          <ProfileDisclosure label="More x01 stats">
            <X01DetailTable rows={buildX01DetailRows(stats, context)} onStatSelect={onStatSelect} />
          </ProfileDisclosure>
        )}
      </Stack>
    </ProfileModeSection>
  )
}
