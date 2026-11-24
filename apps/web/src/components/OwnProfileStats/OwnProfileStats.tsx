import { Stack } from '@chakra-ui/react'
import { Fragment, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { AnalyticsResult } from '@open-dart/analytics/computeAnalytics'
import { computeBigNumbersSummary } from '@open-dart/analytics/practiceStats'
import type { GameSession } from '@open-dart/game/types/gameSession'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import type { ProfileBestSource } from '../../lib/profile/profileCards'
import { buildOwnProfileStatsModel } from '../../lib/profile/ownProfileStats'
import type { OwnProfileStatsModel } from '../../lib/profile/ownProfileStats'
import {
  buildBigNumbersSummaryCards,
  buildBob27SummaryCards,
  buildBullRunCards,
  buildClaimTheBoardCards,
  buildHunterSummaryCards,
  buildOneTwentyOneCards,
  buildTenUpOneDownCards,
} from '../../lib/profile/profileCards'
import { ProfileSectionId, getVisibleOwnProfileSections } from '../../lib/profile/profileSections'
import { JdcChallengeProfileSection } from '../ProfileStatCards/JdcChallengeProfileSection'
import { NinetyNineDartsProfileSection } from '../ProfileStatCards/NinetyNineDartsProfileSection'
import { ProfileCardsSection } from '../ProfileStatCards/ProfileCardsSection'
import { AroundTheClockProfileSection } from './AroundTheClockProfileSection'
import { X01ProfileSection } from './X01ProfileSection'

export interface OwnProfileStatsProps {
  sessions: GameSession[]
  analytics: AnalyticsResult
  onStatSelect: (selection: StatTimelineSelection) => void
  onOpenBest: (source: ProfileBestSource) => void
}

const renderSection = (
  sectionId: ProfileSectionId,
  model: OwnProfileStatsModel,
  sessions: GameSession[],
  onStatSelect: (selection: StatTimelineSelection) => void,
  onOpenBest: (source: ProfileBestSource) => void,
): ReactNode => {
  switch (sectionId) {
    case ProfileSectionId.X01:
      return (
        <X01ProfileSection
          sessions={sessions}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      )
    case ProfileSectionId.JdcChallenge:
      return (
        <JdcChallengeProfileSection
          stats={model.jdcChallenge}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      )
    case ProfileSectionId.NinetyNineDarts:
      return (
        <NinetyNineDartsProfileSection
          groups={model.ninetyNineDarts}
          selectable
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      )
    case ProfileSectionId.BigNumbers:
      return (
        <ProfileCardsSection
          title="Big Numbers"
          cards={buildBigNumbersSummaryCards(model.bigNumbers)}
          empty={model.bigNumbers.sessionCount === 0}
          sessionCount={model.bigNumbers.sessionCount}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      )
    case ProfileSectionId.Bob27:
      return (
        <ProfileCardsSection
          title="Bob's 27"
          cards={buildBob27SummaryCards(model.bob27)}
          empty={model.bob27.sessionCount === 0}
          sessionCount={model.bob27.sessionCount}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      )
    case ProfileSectionId.OneTwentyOne:
      return model.oneTwentyOne === null ? null : (
        <ProfileCardsSection
          title="121"
          cards={buildOneTwentyOneCards(model.oneTwentyOne)}
          sessionCount={model.oneTwentyOne.gameCount}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      )
    case ProfileSectionId.TenUpOneDown:
      return model.tenUpOneDown === null ? null : (
        <ProfileCardsSection
          title="10 Up 1 Down"
          cards={buildTenUpOneDownCards(model.tenUpOneDown)}
          sessionCount={model.tenUpOneDown.gameCount}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      )
    case ProfileSectionId.ClaimTheBoard:
      return model.claimTheBoard === null ? null : (
        <ProfileCardsSection
          title="Claim the Board"
          cards={buildClaimTheBoardCards(model.claimTheBoard)}
          columns={3}
          sessionCount={model.claimTheBoard.gameCount}
        />
      )
    case ProfileSectionId.AroundTheClock:
      return (
        <AroundTheClockProfileSection
          variants={model.aroundTheClock}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      )
    case ProfileSectionId.BullRun:
      return model.bullRun === null ? null : (
        <ProfileCardsSection
          title="Bull Run"
          cards={buildBullRunCards(model.bullRun)}
          sessionCount={model.bullRun.gameCount}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      )
    case ProfileSectionId.Hunter:
      return (
        <ProfileCardsSection
          title="Hunter"
          cards={buildHunterSummaryCards(model.hunter)}
          sessionCount={model.hunter.sessionCount}
          onStatSelect={onStatSelect}
          onOpenBest={onOpenBest}
        />
      )
    default:
      return null
  }
}

export const OwnProfileStats = ({
  sessions,
  analytics,
  onStatSelect,
  onOpenBest,
}: OwnProfileStatsProps) => {
  const model = useMemo(
    () => buildOwnProfileStatsModel(analytics, computeBigNumbersSummary(sessions)),
    [analytics, sessions],
  )

  return (
    <Stack gap={8}>
      {getVisibleOwnProfileSections(model.playedSections).map((sectionId) => (
        <Fragment key={sectionId}>
          {renderSection(sectionId, model, sessions, onStatSelect, onOpenBest)}
        </Fragment>
      ))}
    </Stack>
  )
}
