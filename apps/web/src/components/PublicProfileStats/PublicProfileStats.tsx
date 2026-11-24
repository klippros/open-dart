import { Stack } from '@chakra-ui/react'
import { Fragment, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { PlayerProfileStats } from '@open-dart/analytics'
import { X01StatsFilterId } from '@open-dart/analytics/x01Stats'
import {
  buildBigNumbersSummaryCards,
  buildBob27SummaryCards,
  buildX01DetailRows,
  buildX01SummaryCards,
} from '../../lib/profile/profileCards'
import {
  buildPublicProfileStatsModel,
  getPublicX01Group,
} from '../../lib/profile/publicProfileStats'
import type { PublicProfileStatsModel } from '../../lib/profile/publicProfileStats'
import { X01_PROFILE_VARIANTS, parseX01ProfileVariant } from '../../lib/profile/x01ProfileFilter'
import { PUBLIC_PROFILE_SECTION_ORDER, ProfileSectionId } from '../../lib/profile/profileSections'
import { JdcChallengeProfileSection } from '../ProfileStatCards/JdcChallengeProfileSection'
import { NinetyNineDartsProfileSection } from '../ProfileStatCards/NinetyNineDartsProfileSection'
import { ProfileCardsSection } from '../ProfileStatCards/ProfileCardsSection'
import { ProfileModeSection } from '../ProfileStatCards/ProfileModeSection'
import { ProfileStatCardGrid } from '../ProfileStatCards/ProfileStatCardGrid'
import { StatsVariantToggle } from '../ProfileStatCards/StatsVariantToggle'
import { ProfileDisclosure } from '../OwnProfileStats/ProfileDisclosure'
import { X01DetailTable } from '../OwnProfileStats/X01DetailTable'

export interface PublicProfileStatsProps {
  stats: PlayerProfileStats | null
}

const renderSection = (
  sectionId: ProfileSectionId,
  model: PublicProfileStatsModel,
  x01VariantId: X01StatsFilterId,
  onX01VariantChange: (value: string) => void,
): ReactNode => {
  switch (sectionId) {
    case ProfileSectionId.X01: {
      const variant =
        X01_PROFILE_VARIANTS.find((candidate) => candidate.id === x01VariantId) ??
        X01_PROFILE_VARIANTS[X01_PROFILE_VARIANTS.length - 1]
      const group = getPublicX01Group(model.x01, variant.id)
      const empty = group.summary.legCount === 0
      const context = { scope: variant.scope, scopeLabel: variant.label }

      return (
        <ProfileModeSection
          title="x01"
          trailing={
            <StatsVariantToggle
              items={X01_PROFILE_VARIANTS.map((candidate) => ({
                value: candidate.id,
                label: candidate.label,
                count: getPublicX01Group(model.x01, candidate.id).summary.legCount,
              }))}
              value={variant.id}
              onChange={onX01VariantChange}
            />
          }
        >
          <Stack gap={3}>
            <ProfileStatCardGrid
              cards={buildX01SummaryCards(group.summary, context)}
              empty={empty}
            />
            {empty ? null : (
              <ProfileDisclosure label="More x01 stats">
                <X01DetailTable rows={buildX01DetailRows(group.detail, context)} />
              </ProfileDisclosure>
            )}
          </Stack>
        </ProfileModeSection>
      )
    }
    case ProfileSectionId.JdcChallenge:
      return <JdcChallengeProfileSection stats={model.jdcChallenge} />
    case ProfileSectionId.NinetyNineDarts:
      return <NinetyNineDartsProfileSection groups={model.ninetyNineDarts} />
    case ProfileSectionId.BigNumbers:
      return (
        <ProfileCardsSection
          title="Big Numbers"
          cards={buildBigNumbersSummaryCards(model.bigNumbers)}
          empty={model.bigNumbers.sessionCount === 0}
          sessionCount={model.bigNumbers.sessionCount}
        />
      )
    case ProfileSectionId.Bob27:
      return (
        <ProfileCardsSection
          title="Bob's 27"
          cards={buildBob27SummaryCards(model.bob27)}
          empty={model.bob27.sessionCount === 0}
          sessionCount={model.bob27.sessionCount}
        />
      )
    case ProfileSectionId.OneTwentyOne:
    case ProfileSectionId.TenUpOneDown:
    case ProfileSectionId.ClaimTheBoard:
    case ProfileSectionId.AroundTheClock:
    case ProfileSectionId.BullRun:
    case ProfileSectionId.Hunter:
      return null
    default:
      return null
  }
}

export const PublicProfileStats = ({ stats }: PublicProfileStatsProps) => {
  const model = useMemo(() => buildPublicProfileStatsModel(stats), [stats])
  const [x01VariantId, setX01VariantId] = useState(X01StatsFilterId.All)

  return (
    <Stack gap={8}>
      {PUBLIC_PROFILE_SECTION_ORDER.map((sectionId) => (
        <Fragment key={sectionId}>
          {renderSection(sectionId, model, x01VariantId, (value) => {
            const next = parseX01ProfileVariant(value)
            if (next !== null) {
              setX01VariantId(next)
            }
          })}
        </Fragment>
      ))}
    </Stack>
  )
}
