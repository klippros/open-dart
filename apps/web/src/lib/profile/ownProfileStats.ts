import type {
  AnalyticsResult,
  AroundTheClockPracticeStats,
  BullRunPracticeStats,
  CheckoutPracticeStats,
  ClaimTheBoardPracticeStats,
} from '@open-dart/analytics/computeAnalytics'
import {
  isAroundTheClockPracticeStats,
  isBob27PracticeStats,
  isBullRunPracticeStats,
  isClaimTheBoardPracticeStats,
  isHunterPracticeStats,
  isJdcChallengePracticeStats,
  isNinetyNineDartsPracticeStats,
} from '@open-dart/analytics/practiceStats'
import type { BigNumbersSummaryStats } from '@open-dart/analytics/practiceStats'
import { GameModeId } from '@open-dart/game/types/gameMode'
import {
  NINETY_NINE_DARTS_GROUPS,
  emptyNinetyNineDartsGroup,
  sessionBestSource,
} from './profileCards'
import type {
  BigNumbersSummaryInput,
  Bob27SummaryInput,
  HunterSummaryInput,
  JdcChallengeSummaryInput,
  NinetyNineDartsGroupInput,
} from './profileCards'
import { ProfileSectionId } from './profileSections'

export interface OwnProfileStatsModel {
  jdcChallenge: JdcChallengeSummaryInput
  ninetyNineDarts: NinetyNineDartsGroupInput[]
  bigNumbers: BigNumbersSummaryInput
  bob27: Bob27SummaryInput
  hunter: HunterSummaryInput
  oneTwentyOne: CheckoutPracticeStats | null
  tenUpOneDown: CheckoutPracticeStats | null
  claimTheBoard: ClaimTheBoardPracticeStats | null
  aroundTheClock: AroundTheClockPracticeStats[]
  bullRun: BullRunPracticeStats | null
  playedSections: ReadonlySet<ProfileSectionId>
}

export const buildOwnProfileStatsModel = (
  analytics: AnalyticsResult,
  bigNumbers: BigNumbersSummaryStats,
): OwnProfileStatsModel => {
  const { checkout, other } = analytics.practice
  const jdc = other.find(isJdcChallengePracticeStats)
  const bob27 = other.find(isBob27PracticeStats)
  const hunter = other.find(isHunterPracticeStats) ?? null
  const ninetyNine = other.filter(isNinetyNineDartsPracticeStats)
  const oneTwentyOne = checkout.find((stats) => stats.mode === GameModeId.OneTwentyOne) ?? null
  const tenUpOneDown = checkout.find((stats) => stats.mode === GameModeId.TenUpOneDown) ?? null
  const claimTheBoard = other.find(isClaimTheBoardPracticeStats) ?? null
  const aroundTheClock = other.filter(isAroundTheClockPracticeStats)
  const bullRun = other.find(isBullRunPracticeStats) ?? null

  const playedSections = new Set<ProfileSectionId>()
  if (oneTwentyOne !== null) {
    playedSections.add(ProfileSectionId.OneTwentyOne)
  }
  if (tenUpOneDown !== null) {
    playedSections.add(ProfileSectionId.TenUpOneDown)
  }
  if (claimTheBoard !== null) {
    playedSections.add(ProfileSectionId.ClaimTheBoard)
  }
  if (aroundTheClock.length > 0) {
    playedSections.add(ProfileSectionId.AroundTheClock)
  }
  if (bullRun !== null) {
    playedSections.add(ProfileSectionId.BullRun)
  }
  if (hunter !== null) {
    playedSections.add(ProfileSectionId.Hunter)
  }

  return {
    jdcChallenge: {
      sessionCount: jdc?.gameCount ?? 0,
      avgScore: jdc?.avgFinalScore ?? null,
      avgShanghais: jdc?.avgShanghaisPerGame ?? null,
      bestScore: jdc?.bestFinalScore ?? null,
      bestScoreSource: sessionBestSource(jdc?.bestSessionId),
      avgShanghaiLowScore: jdc?.avgShanghaiLowScore ?? null,
      avgDoublesScore: jdc?.avgDoublesScore ?? null,
      avgShanghaiHighScore: jdc?.avgShanghaiHighScore ?? null,
    },
    ninetyNineDarts: NINETY_NINE_DARTS_GROUPS.map((group) => {
      const stats = ninetyNine.find((candidate) => candidate.group === group)
      if (stats === undefined) {
        return emptyNinetyNineDartsGroup(group)
      }
      return {
        group,
        sessionCount: stats.gameCount,
        avgScore: stats.avgFinalScore,
        bestScore: stats.bestFinalScore,
        bestScoreSource: sessionBestSource(stats.bestSessionId),
        hitRate: stats.hitRate,
        avgSingles: stats.avgSinglesPerGame,
        avgDoubles: stats.avgDoublesPerGame,
        avgTrebles: stats.avgTreblesPerGame,
      }
    }),
    bigNumbers: {
      sessionCount: bigNumbers.gameCount,
      hitRate: bigNumbers.hitRate,
      bestHitRate: bigNumbers.bestHitRate,
      bestHitRateSource: sessionBestSource(bigNumbers.bestHitRateSessionId),
    },
    bob27: {
      sessionCount: bob27?.gameCount ?? 0,
      avgScore: bob27?.avgFinalScore ?? null,
      hitRate: bob27?.hitRate ?? null,
      avgHitsPerVisit: bob27?.avgHitsPerVisit ?? null,
      avgDoublesPerGame: bob27?.avgDoublesPerGame ?? null,
      bestScore: bob27?.bestFinalScore ?? null,
      bestScoreSource: sessionBestSource(bob27?.bestSessionId),
      bestHitsPerVisit: bob27?.bestHitsPerVisit ?? null,
      bestDoublesPerGame: bob27?.bestDoublesPerGame ?? null,
    },
    hunter: {
      sessionCount: hunter?.gameCount ?? 0,
      avgAdvancesPerVisit: hunter?.avgAdvancesPerVisit ?? null,
      hitRate: hunter?.hitRate ?? null,
    },
    oneTwentyOne,
    tenUpOneDown,
    claimTheBoard,
    aroundTheClock,
    bullRun,
    playedSections,
  }
}
