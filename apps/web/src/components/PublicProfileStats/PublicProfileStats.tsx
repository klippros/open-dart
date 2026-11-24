import { HStack, Stack, Text } from '@chakra-ui/react'
import { Fragment, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { PlayerProfileStats } from '@open-dart/analytics'
import {
  buildBigNumbersSummaryCards,
  buildBob27SummaryCards,
  buildX01SummaryCards,
} from '../../lib/profile/profileCards'
import { buildPublicProfileStatsModel } from '../../lib/profile/publicProfileStats'
import type { PublicProfileStatsModel } from '../../lib/profile/publicProfileStats'
import { PUBLIC_PROFILE_SECTION_ORDER, ProfileSectionId } from '../../lib/profile/profileSections'
import { JdcChallengeProfileSection } from '../ProfileStatCards/JdcChallengeProfileSection'
import { NinetyNineDartsProfileSection } from '../ProfileStatCards/NinetyNineDartsProfileSection'
import { ProfileCardsSection } from '../ProfileStatCards/ProfileCardsSection'
import { StatsCountLabel } from '../ProfileStatCards/StatsCountLabel'
import { ProfileModeSection } from '../ProfileStatCards/ProfileModeSection'
import { ProfileStatCardGrid } from '../ProfileStatCards/ProfileStatCardGrid'

export interface PublicProfileStatsProps {
  stats: PlayerProfileStats | null
}

const X01_PUBLIC_CONTEXT = { scope: { type: 'x01-501-online' as const }, scopeLabel: '501 online' }

const renderSection = (sectionId: ProfileSectionId, model: PublicProfileStatsModel): ReactNode => {
  switch (sectionId) {
    case ProfileSectionId.X01:
      return (
        <ProfileModeSection
          title="x01"
          trailing={
            <HStack gap={3}>
              <Text fontSize="sm" color="whiteAlpha.700">
                501 online
              </Text>
              <StatsCountLabel count={model.x01.legCount} unit="Leg" />
            </HStack>
          }
        >
          <ProfileStatCardGrid
            cards={buildX01SummaryCards(model.x01, X01_PUBLIC_CONTEXT)}
            empty={model.x01.legCount === 0}
          />
        </ProfileModeSection>
      )
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

  return (
    <Stack gap={8}>
      {PUBLIC_PROFILE_SECTION_ORDER.map((sectionId) => (
        <Fragment key={sectionId}>{renderSection(sectionId, model)}</Fragment>
      ))}
    </Stack>
  )
}
