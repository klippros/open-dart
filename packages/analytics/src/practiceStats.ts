import { AroundTheClockAimMode } from '@open-dart/game/types/aroundTheClock.ts'
import { BigNumbersRequiredHits } from '@open-dart/game/types/bigNumbers.ts'
import { GameModeId } from '@open-dart/game/types/gameMode.ts'
import type { GameSession } from '@open-dart/game/types/gameSession.ts'
import { gameModeDefinitions } from '@open-dart/game/game/gameModeDefinitions.ts'
import { getAroundTheClockAimModeLabel } from '@open-dart/game/aroundTheClock/aroundTheClockConfig.ts'
import { getBigNumbersRequiredHitsLabel } from '@open-dart/game/bigNumbers/bigNumbersConfig.ts'
import {
  getBob27AvgHitsPerVisit,
  getBob27SessionDoublesHit,
  getBob27VisitHitRate,
} from './bob27VisitStats.ts'
import {
  getBigNumbersAvgHitsPerVisit,
  getBigNumbersBestSessionHitRate,
  getBigNumbersHitRate,
  getBigNumbersSessionHitRate,
  getBigNumbersSessionVisitCount,
} from './bigNumbersVisitStats.ts'
import { computeHunterPracticeRollup } from './hunterVisitStats.ts'
import { getClaimTheBoardPrimaryPlayerStats } from './claimTheBoardVisitStats.ts'
import {
  computeBullRunSingleSessionStats,
  getBullRunHitRateFromCounts,
  mergeBullRunOutcomeCounts,
  ratePerThreeDarts,
} from './bullRunVisitStats.ts'
import { computeJdcChallengeSingleSessionStats } from './jdcChallengeVisitStats.ts'
import {
  computeNinetyNineDartsSingleSessionStats,
  getNinetyNineDartsHitRateFromCounts,
  getNinetyNineDartsStatGroupLabel,
  mergeNinetyNineDartsOutcomeCounts,
  NinetyNineDartsStatGroup,
} from './ninetyNineVisitStats.ts'
import { emptyBaseHitCounts, emptyHitCounts } from './hitOutcomeStats.ts'
import { getSessionModeLabel } from './sessionLabels.ts'
import {
  getHighestOneTwentyOneCheckoutTarget,
  getOneTwentyOneCheckoutRate,
  getSessionCheckoutCount,
} from './oneTwentyOneVisitStats.ts'
import {
  aggregateAroundTheClockSessionStats,
  computeAroundTheClockSingleSessionStats,
} from './aroundTheClockStats.ts'
import type { AroundTheClockPerTargetStats } from './aroundTheClockStats.ts'
import { getLatestSessionStartedAt } from './pickLastPlayedVariant.ts'
import {
  filterAroundTheClockSessions,
  filterBigNumbersSessions,
  filterJdcChallengeSessions,
  filterNinetyNineDartsSessions,
} from './sessionScope.ts'
import {
  countCheckoutVisits,
  getHighestCheckout,
  countDartsInSession,
  getPrimaryPlayerVisits,
  getSessionCheckoutRate,
  getSessionFinalScore,
  getThreeDartAverage,
} from './visitStats.ts'

export interface CheckoutPracticeStats {
  mode: GameModeId.OneTwentyOne | GameModeId.TenUpOneDown
  label: string
  gameCount: number
  visitCount: number
  checkoutRate: number | null
  /** Best single-session checkout rate. */
  bestCheckoutRate: number | null
  /** Session that produced `bestCheckoutRate`. */
  bestCheckoutRateSessionId?: string | null
  threeDartAverage: number | null
  /** Best single-session 3-dart average. */
  bestThreeDartAverage: number | null
  /** Session that produced `bestThreeDartAverage`. */
  bestThreeDartAverageSessionId?: string | null
  avgCheckoutsPerGame: number | null
  bestCheckoutsPerGame: number | null
  /** Session that produced `bestCheckoutsPerGame`. */
  bestCheckoutsSessionId?: string | null
  highestCheckout: number | null
  lastPlayedAt: string
}

export interface Bob27PracticeStats {
  mode: GameModeId.Bob27
  label: string
  gameCount: number
  completedCount: number
  avgFinalScore: number | null
  bestFinalScore: number | null
  /** Session that produced `bestFinalScore`. */
  bestSessionId?: string | null
  hitRate: number | null
  avgHitsPerVisit: number | null
  bestHitsPerVisit: number | null
  avgDoublesPerGame: number | null
  bestDoublesPerGame: number | null
}

/** Big Numbers pooled across every required-hits variant. */
export interface BigNumbersSummaryStats {
  gameCount: number
  hitRate: number | null
  bestHitRate: number | null
  /** Session that produced `bestHitRate`. */
  bestHitRateSessionId?: string | null
}

export interface ClaimTheBoardPracticeStats {
  mode: GameModeId.ClaimTheBoard
  label: string
  gameCount: number
  avgHitsPerVisit: number | null
  avgFieldsClaimedPerGame: number | null
  avgFieldsHitOncePerGame: number | null
  avgFieldsHitTwicePerGame: number | null
  avgFieldsHitThricePerGame: number | null
  avgFinalScore: number | null
}

export interface AroundTheClockPracticeStats {
  mode: GameModeId.AroundTheClock
  aimMode: AroundTheClockAimMode
  label: string
  gameCount: number
  completedCount: number
  completionRate: number | null
  avgDartsFullRun: number | null
  bestDartsFullRun: number | null
  /** Completed session that produced `bestDartsFullRun`. */
  bestDartsSessionId?: string | null
  avgDartsPerField: number | null
  bestDartsPerField: number | null
  /** Session that produced `bestDartsPerField`. */
  bestDartsPerFieldSessionId?: string | null
  targets: AroundTheClockPerTargetStats[]
  lastPlayedAt: string
}

export interface NinetyNineDartsPracticeStats {
  mode: GameModeId.NinetyNineDarts
  group: NinetyNineDartsStatGroup
  label: string
  gameCount: number
  completedCount: number
  avgFinalScore: number | null
  bestFinalScore: number | null
  /** Session that produced `bestFinalScore`. */
  bestSessionId?: string | null
  hitRate: number | null
  avgSinglesPerGame: number | null
  avgDoublesPerGame: number | null
  avgTreblesPerGame: number | null
  lastPlayedAt: string
}

export interface BullRunPracticeStats {
  mode: GameModeId.BullRun
  label: string
  gameCount: number
  completedCount: number
  hitRate: number | null
  singlesPerThreeDarts: number | null
  doublesPerThreeDarts: number | null
  avgPerThreeDarts: number | null
  lastPlayedAt: string
}

export interface BigNumbersPracticeStats {
  mode: GameModeId.BigNumbers
  requiredHits: BigNumbersRequiredHits
  label: string
  gameCount: number
  completedCount: number
  avgHitsPerVisit: number | null
  hitRate: number | null
  bestHitRate: number | null
  avgVisitsToComplete: number | null
  bestVisitsToComplete: number | null
  lastPlayedAt: string
}

export interface HunterPracticeStats {
  mode: GameModeId.Hunter
  label: string
  gameCount: number
  avgAdvancesPerVisit: number | null
  hitRate: number | null
  lastPlayedAt: string
}

export interface JdcChallengePracticeStats {
  mode: GameModeId.JdcChallenge
  label: string
  gameCount: number
  completedCount: number
  avgFinalScore: number | null
  bestFinalScore: number | null
  /** Session that produced `bestFinalScore`. */
  bestSessionId?: string | null
  avgShanghaiLowScore: number | null
  avgDoublesScore: number | null
  avgShanghaiHighScore: number | null
  avgShanghaisPerGame: number | null
  bestShanghaisPerGame: number | null
  lastPlayedAt: string
}

export type OtherPracticeStats =
  | Bob27PracticeStats
  | ClaimTheBoardPracticeStats
  | AroundTheClockPracticeStats
  | NinetyNineDartsPracticeStats
  | BullRunPracticeStats
  | BigNumbersPracticeStats
  | JdcChallengePracticeStats
  | HunterPracticeStats

export interface PracticeStats {
  checkout: CheckoutPracticeStats[]
  other: OtherPracticeStats[]
}

const CHECKOUT_PRACTICE_MODES = [GameModeId.OneTwentyOne, GameModeId.TenUpOneDown] as const

const AROUND_THE_CLOCK_AIM_MODES = [
  AroundTheClockAimMode.Singles,
  AroundTheClockAimMode.Doubles,
  AroundTheClockAimMode.Trebles,
  AroundTheClockAimMode.Any,
] as const

const NINETY_NINE_DARTS_STAT_GROUPS = [
  NinetyNineDartsStatGroup.Twenty,
  NinetyNineDartsStatGroup.Bull,
  NinetyNineDartsStatGroup.Other,
] as const

const BIG_NUMBERS_REQUIRED_HITS = [
  BigNumbersRequiredHits.Zero,
  BigNumbersRequiredHits.One,
  BigNumbersRequiredHits.Two,
  BigNumbersRequiredHits.Three,
] as const

const getSessionLabel = (sessions: GameSession[], mode: GameModeId): string => {
  const [firstSession] = sessions

  return firstSession === undefined
    ? gameModeDefinitions[mode].label
    : getSessionModeLabel(firstSession)
}

const averageOrNull = (values: number[]): number | null =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length

/** First session with the winning score. Ties keep the earlier session. */
const pickBestSession = (
  sessions: readonly GameSession[],
  score: (session: GameSession) => number | null,
  prefer: 'max' | 'min',
): GameSession | null => {
  let winner: GameSession | null = null
  let winnerScore: number | null = null

  for (const session of sessions) {
    const value = score(session)

    if (value === null) {
      continue
    }

    if (
      winner === null ||
      winnerScore === null ||
      (prefer === 'max' ? value > winnerScore : value < winnerScore)
    ) {
      winner = session
      winnerScore = value
    }
  }

  return winner
}

const computeCheckoutPracticeStats = (
  mode: GameModeId.OneTwentyOne | GameModeId.TenUpOneDown,
  sessions: GameSession[],
): CheckoutPracticeStats | null => {
  const modeSessions = sessions.filter((session) => session.mode === mode)

  if (modeSessions.length === 0) {
    return null
  }

  const visits = modeSessions.flatMap((session) => getPrimaryPlayerVisits(session))
  const checkoutVisits = countCheckoutVisits(visits)
  const checkoutsPerGame = modeSessions.map((session) => getSessionCheckoutCount(session))
  const checkoutRateForSession = (session: GameSession): number | null =>
    mode === GameModeId.OneTwentyOne
      ? getOneTwentyOneCheckoutRate(getPrimaryPlayerVisits(session))
      : getSessionCheckoutRate(session)
  const bestCheckoutRateSession = pickBestSession(modeSessions, checkoutRateForSession, 'max')
  const bestThreeDartAverageSession = pickBestSession(
    modeSessions,
    (session) => getThreeDartAverage(getPrimaryPlayerVisits(session)),
    'max',
  )

  const lastPlayedAt = getLatestSessionStartedAt(modeSessions)

  if (lastPlayedAt === null) {
    return null
  }

  return {
    mode,
    label: getSessionLabel(modeSessions, mode),
    gameCount: modeSessions.length,
    visitCount: visits.length,
    checkoutRate:
      mode === GameModeId.OneTwentyOne
        ? getOneTwentyOneCheckoutRate(visits)
        : visits.length === 0
          ? null
          : (checkoutVisits / visits.length) * 100,
    bestCheckoutRate:
      bestCheckoutRateSession === null ? null : checkoutRateForSession(bestCheckoutRateSession),
    bestCheckoutRateSessionId: bestCheckoutRateSession?.id ?? null,
    threeDartAverage: getThreeDartAverage(visits),
    bestThreeDartAverage:
      bestThreeDartAverageSession === null
        ? null
        : getThreeDartAverage(getPrimaryPlayerVisits(bestThreeDartAverageSession)),
    bestThreeDartAverageSessionId: bestThreeDartAverageSession?.id ?? null,
    avgCheckoutsPerGame:
      checkoutsPerGame.length === 0
        ? null
        : checkoutsPerGame.reduce((sum, count) => sum + count, 0) / checkoutsPerGame.length,
    bestCheckoutsPerGame: checkoutsPerGame.length === 0 ? null : Math.max(...checkoutsPerGame),
    bestCheckoutsSessionId:
      pickBestSession(modeSessions, (session) => getSessionCheckoutCount(session), 'max')?.id ??
      null,
    highestCheckout:
      mode === GameModeId.OneTwentyOne
        ? getHighestOneTwentyOneCheckoutTarget(visits)
        : getHighestCheckout(visits),
    lastPlayedAt,
  }
}

const computeBob27Stats = (sessions: GameSession[]): Bob27PracticeStats | null => {
  const modeSessions = sessions.filter((session) => session.mode === GameModeId.Bob27)

  if (modeSessions.length === 0) {
    return null
  }

  const completedSessions = modeSessions.filter((session) => session.finishedEarly !== true)
  const visits = modeSessions.flatMap((session) => getPrimaryPlayerVisits(session))
  const finalScores = modeSessions
    .map((session) => getSessionFinalScore(session))
    .filter((score): score is number => score !== null)
  const doublesPerGame = completedSessions.map((session) => getBob27SessionDoublesHit(session))
  const hitsPerVisitBySession = modeSessions
    .map((session) => getBob27AvgHitsPerVisit(getPrimaryPlayerVisits(session)))
    .filter((value): value is number => value !== null)

  return {
    mode: GameModeId.Bob27,
    label: getSessionLabel(modeSessions, GameModeId.Bob27),
    gameCount: modeSessions.length,
    completedCount: completedSessions.length,
    avgFinalScore:
      finalScores.length === 0
        ? null
        : finalScores.reduce((sum, score) => sum + score, 0) / finalScores.length,
    bestFinalScore: finalScores.length === 0 ? null : Math.max(...finalScores),
    bestSessionId:
      pickBestSession(modeSessions, (session) => getSessionFinalScore(session), 'max')?.id ?? null,
    hitRate: getBob27VisitHitRate(visits),
    avgHitsPerVisit: getBob27AvgHitsPerVisit(visits),
    bestHitsPerVisit:
      hitsPerVisitBySession.length === 0 ? null : Math.max(...hitsPerVisitBySession),
    avgDoublesPerGame:
      doublesPerGame.length === 0
        ? null
        : doublesPerGame.reduce((sum, count) => sum + count, 0) / doublesPerGame.length,
    bestDoublesPerGame: doublesPerGame.length === 0 ? null : Math.max(...doublesPerGame),
  }
}

const computeClaimTheBoardStats = (sessions: GameSession[]): ClaimTheBoardPracticeStats | null => {
  const modeSessions = sessions.filter((session) => session.mode === GameModeId.ClaimTheBoard)

  if (modeSessions.length === 0) {
    return null
  }

  const perGame = modeSessions
    .map((session) => getClaimTheBoardPrimaryPlayerStats(session))
    .filter((stats): stats is NonNullable<typeof stats> => stats !== null)

  if (perGame.length === 0) {
    return null
  }

  const allVisits = modeSessions.flatMap((session) => getPrimaryPlayerVisits(session))
  const totalHits = perGame.reduce((sum, stats) => sum + stats.totalHits, 0)

  return {
    mode: GameModeId.ClaimTheBoard,
    label: getSessionLabel(modeSessions, GameModeId.ClaimTheBoard),
    gameCount: modeSessions.length,
    avgHitsPerVisit: allVisits.length === 0 ? null : totalHits / allVisits.length,
    avgFieldsClaimedPerGame: averageOrNull(perGame.map((stats) => stats.fieldsClaimed)),
    avgFieldsHitOncePerGame: averageOrNull(perGame.map((stats) => stats.fieldsHitOnce)),
    avgFieldsHitTwicePerGame: averageOrNull(perGame.map((stats) => stats.fieldsHitTwice)),
    avgFieldsHitThricePerGame: averageOrNull(perGame.map((stats) => stats.fieldsHitThrice)),
    avgFinalScore: averageOrNull(
      perGame.map((stats) => stats.finalScore).filter((score): score is number => score !== null),
    ),
  }
}

const computeAroundTheClockStatsForAimMode = (
  sessions: GameSession[],
  aimMode: AroundTheClockAimMode,
): AroundTheClockPracticeStats | null => {
  const aimModeSessions = filterAroundTheClockSessions(sessions, aimMode)

  if (aimModeSessions.length === 0) {
    return null
  }

  const aggregated = aggregateAroundTheClockSessionStats(aimModeSessions, aimMode)
  const completedSessions = aimModeSessions.filter((session) => session.finishedEarly !== true)
  const lastPlayedAt = getLatestSessionStartedAt(aimModeSessions)

  if (lastPlayedAt === null) {
    return null
  }

  return {
    mode: GameModeId.AroundTheClock,
    aimMode,
    label: `${gameModeDefinitions[GameModeId.AroundTheClock].label} · ${getAroundTheClockAimModeLabel(aimMode)}`,
    gameCount: aimModeSessions.length,
    completedCount: completedSessions.length,
    completionRate: aggregated.completionRate,
    avgDartsFullRun: aggregated.avgDartsFullRun,
    bestDartsFullRun: aggregated.bestDartsFullRun,
    bestDartsSessionId:
      pickBestSession(completedSessions, (session) => countDartsInSession(session), 'min')?.id ??
      null,
    avgDartsPerField: aggregated.avgDartsPerField,
    bestDartsPerField: aggregated.bestDartsPerField,
    bestDartsPerFieldSessionId:
      pickBestSession(
        aimModeSessions,
        (session) => computeAroundTheClockSingleSessionStats(session)?.avgDartsPerField ?? null,
        'min',
      )?.id ?? null,
    targets: aggregated.targets,
    lastPlayedAt,
  }
}

const computeNinetyNineDartsStatsForGroup = (
  sessions: GameSession[],
  group: NinetyNineDartsStatGroup,
): NinetyNineDartsPracticeStats | null => {
  const groupSessions = filterNinetyNineDartsSessions(sessions, group)

  if (groupSessions.length === 0) {
    return null
  }

  const completedSessions = groupSessions.filter((session) => session.finishedEarly !== true)
  const lastPlayedAt = getLatestSessionStartedAt(groupSessions)

  if (lastPlayedAt === null) {
    return null
  }

  const sessionStats = groupSessions.flatMap((session) => {
    const stats = computeNinetyNineDartsSingleSessionStats(session)

    return stats === null ? [] : [{ session, stats }]
  })

  const finalScores = sessionStats
    .map((item) => item.stats.score)
    .filter((score): score is number => score !== null)

  const totals = sessionStats.reduce(
    (counts, item) => mergeNinetyNineDartsOutcomeCounts(counts, item.stats.counts),
    emptyHitCounts(),
  )
  const bestScoreSession = sessionStats.reduce<{ sessionId: string; score: number } | null>(
    (best, item) => {
      if (item.stats.score === null || (best !== null && item.stats.score <= best.score)) {
        return best
      }

      return { sessionId: item.session.id, score: item.stats.score }
    },
    null,
  )

  return {
    mode: GameModeId.NinetyNineDarts,
    group,
    label: `${gameModeDefinitions[GameModeId.NinetyNineDarts].label} · ${getNinetyNineDartsStatGroupLabel(group)}`,
    gameCount: groupSessions.length,
    completedCount: completedSessions.length,
    avgFinalScore: averageOrNull(finalScores),
    bestFinalScore: finalScores.length === 0 ? null : Math.max(...finalScores),
    bestSessionId: bestScoreSession?.sessionId ?? null,
    hitRate: getNinetyNineDartsHitRateFromCounts(totals),
    avgSinglesPerGame: averageOrNull(sessionStats.map((item) => item.stats.counts.singles)),
    avgDoublesPerGame: averageOrNull(sessionStats.map((item) => item.stats.counts.doubles)),
    avgTreblesPerGame:
      group === NinetyNineDartsStatGroup.Bull
        ? null
        : averageOrNull(sessionStats.map((item) => item.stats.counts.trebles)),
    lastPlayedAt,
  }
}

const computeBullRunStats = (sessions: GameSession[]): BullRunPracticeStats | null => {
  const modeSessions = sessions.filter((session) => session.mode === GameModeId.BullRun)

  if (modeSessions.length === 0) {
    return null
  }

  const completedSessions = modeSessions.filter((session) => session.finishedEarly !== true)
  const lastPlayedAt = getLatestSessionStartedAt(modeSessions)

  if (lastPlayedAt === null) {
    return null
  }

  const sessionStats = modeSessions
    .map((session) => computeBullRunSingleSessionStats(session))
    .filter((stats): stats is NonNullable<typeof stats> => stats !== null)

  const totals = sessionStats.reduce(
    (counts, stats) => mergeBullRunOutcomeCounts(counts, stats.counts),
    emptyBaseHitCounts(),
  )
  const totalDarts = sessionStats.reduce((sum, stats) => sum + stats.dartsThrown, 0)
  const totalPoints = sessionStats.reduce((sum, stats) => sum + (stats.score ?? 0), 0)

  return {
    mode: GameModeId.BullRun,
    label: gameModeDefinitions[GameModeId.BullRun].label,
    gameCount: modeSessions.length,
    completedCount: completedSessions.length,
    hitRate: getBullRunHitRateFromCounts(totals),
    singlesPerThreeDarts: ratePerThreeDarts(totals.singles, totalDarts),
    doublesPerThreeDarts: ratePerThreeDarts(totals.doubles, totalDarts),
    avgPerThreeDarts: ratePerThreeDarts(totalPoints, totalDarts),
    lastPlayedAt,
  }
}

const computeBigNumbersStatsForRequiredHits = (
  sessions: GameSession[],
  requiredHits: BigNumbersRequiredHits,
): BigNumbersPracticeStats | null => {
  const modeSessions = filterBigNumbersSessions(sessions, requiredHits)

  if (modeSessions.length === 0) {
    return null
  }

  const completedSessions = modeSessions.filter((session) => session.finishedEarly !== true)
  const lastPlayedAt = getLatestSessionStartedAt(modeSessions)

  if (lastPlayedAt === null) {
    return null
  }

  const allVisits = modeSessions.flatMap((session) => getPrimaryPlayerVisits(session))
  const completedVisitCounts = completedSessions.map((session) =>
    getBigNumbersSessionVisitCount(session),
  )

  return {
    mode: GameModeId.BigNumbers,
    requiredHits,
    label: `${gameModeDefinitions[GameModeId.BigNumbers].label} · ${getBigNumbersRequiredHitsLabel(requiredHits)}`,
    gameCount: modeSessions.length,
    completedCount: completedSessions.length,
    avgHitsPerVisit: getBigNumbersAvgHitsPerVisit(allVisits),
    hitRate: getBigNumbersHitRate(allVisits),
    bestHitRate: getBigNumbersBestSessionHitRate(modeSessions),
    avgVisitsToComplete: averageOrNull(completedVisitCounts),
    bestVisitsToComplete:
      completedVisitCounts.length === 0 ? null : Math.min(...completedVisitCounts),
    lastPlayedAt,
  }
}

export const computeBigNumbersSummary = (sessions: GameSession[]): BigNumbersSummaryStats => {
  const modeSessions = filterBigNumbersSessions(sessions)

  return {
    gameCount: modeSessions.length,
    hitRate: getBigNumbersHitRate(
      modeSessions.flatMap((session) => getPrimaryPlayerVisits(session)),
    ),
    bestHitRate: getBigNumbersBestSessionHitRate(modeSessions),
    bestHitRateSessionId:
      pickBestSession(modeSessions, (session) => getBigNumbersSessionHitRate(session), 'max')?.id ??
      null,
  }
}

const computeHunterStats = (sessions: GameSession[]): HunterPracticeStats | null => {
  const modeSessions = sessions.filter((session) => session.mode === GameModeId.Hunter)

  if (modeSessions.length === 0) {
    return null
  }

  const lastPlayedAt = getLatestSessionStartedAt(modeSessions)

  if (lastPlayedAt === null) {
    return null
  }

  const rollup = computeHunterPracticeRollup(modeSessions)

  return {
    mode: GameModeId.Hunter,
    label: gameModeDefinitions[GameModeId.Hunter].label,
    gameCount: rollup.gameCount,
    avgAdvancesPerVisit: rollup.avgAdvancesPerVisit,
    hitRate: rollup.hitRate,
    lastPlayedAt,
  }
}

const computeJdcChallengeStats = (sessions: GameSession[]): JdcChallengePracticeStats | null => {
  const modeSessions = filterJdcChallengeSessions(sessions)

  if (modeSessions.length === 0) {
    return null
  }

  const completedSessions = modeSessions.filter((session) => session.finishedEarly !== true)
  const lastPlayedAt = getLatestSessionStartedAt(modeSessions)

  if (lastPlayedAt === null) {
    return null
  }

  const completedStats = completedSessions.flatMap((session) => {
    const stats = computeJdcChallengeSingleSessionStats(session)

    return stats === null || !stats.completed ? [] : [{ session, stats }]
  })

  const scores = completedStats.map((item) => item.stats.score)
  const shanghaiLowScores = completedStats.map((item) => item.stats.shanghaiLowScore)
  const doublesScores = completedStats.map((item) => item.stats.doublesScore)
  const shanghaiHighScores = completedStats.map((item) => item.stats.shanghaiHighScore)
  const shanghais = completedStats.map((item) => item.stats.shanghaisHit)
  const bestScoreSession = completedStats.reduce<{ sessionId: string; score: number } | null>(
    (best, item) => {
      if (best !== null && item.stats.score <= best.score) {
        return best
      }

      return { sessionId: item.session.id, score: item.stats.score }
    },
    null,
  )

  return {
    mode: GameModeId.JdcChallenge,
    label: gameModeDefinitions[GameModeId.JdcChallenge].label,
    gameCount: modeSessions.length,
    completedCount: completedSessions.length,
    avgFinalScore: averageOrNull(scores),
    bestFinalScore: scores.length === 0 ? null : Math.max(...scores),
    bestSessionId: bestScoreSession?.sessionId ?? null,
    avgShanghaiLowScore: averageOrNull(shanghaiLowScores),
    avgDoublesScore: averageOrNull(doublesScores),
    avgShanghaiHighScore: averageOrNull(shanghaiHighScores),
    avgShanghaisPerGame: averageOrNull(shanghais),
    bestShanghaisPerGame: shanghais.length === 0 ? null : Math.max(...shanghais),
    lastPlayedAt,
  }
}

export const computePracticeStats = (sessions: GameSession[]): PracticeStats => ({
  checkout: CHECKOUT_PRACTICE_MODES.flatMap((mode) => {
    const stats = computeCheckoutPracticeStats(mode, sessions)

    return stats === null ? [] : [stats]
  }),
  other: [
    computeBob27Stats(sessions),
    computeClaimTheBoardStats(sessions),
    ...AROUND_THE_CLOCK_AIM_MODES.map((aimMode) =>
      computeAroundTheClockStatsForAimMode(sessions, aimMode),
    ),
    ...NINETY_NINE_DARTS_STAT_GROUPS.map((group) =>
      computeNinetyNineDartsStatsForGroup(sessions, group),
    ),
    computeBullRunStats(sessions),
    ...BIG_NUMBERS_REQUIRED_HITS.map((requiredHits) =>
      computeBigNumbersStatsForRequiredHits(sessions, requiredHits),
    ),
    computeJdcChallengeStats(sessions),
    computeHunterStats(sessions),
  ].flatMap((stats) => (stats === null ? [] : [stats])),
})

export const isBob27PracticeStats = (stats: OtherPracticeStats): stats is Bob27PracticeStats =>
  stats.mode === GameModeId.Bob27

export const isClaimTheBoardPracticeStats = (
  stats: OtherPracticeStats,
): stats is ClaimTheBoardPracticeStats => stats.mode === GameModeId.ClaimTheBoard

export const isAroundTheClockPracticeStats = (
  stats: OtherPracticeStats,
): stats is AroundTheClockPracticeStats => stats.mode === GameModeId.AroundTheClock

export const isNinetyNineDartsPracticeStats = (
  stats: OtherPracticeStats,
): stats is NinetyNineDartsPracticeStats => stats.mode === GameModeId.NinetyNineDarts

export const isBullRunPracticeStats = (stats: OtherPracticeStats): stats is BullRunPracticeStats =>
  stats.mode === GameModeId.BullRun

export const isBigNumbersPracticeStats = (
  stats: OtherPracticeStats,
): stats is BigNumbersPracticeStats => stats.mode === GameModeId.BigNumbers

export const isJdcChallengePracticeStats = (
  stats: OtherPracticeStats,
): stats is JdcChallengePracticeStats => stats.mode === GameModeId.JdcChallenge

export const isHunterPracticeStats = (stats: OtherPracticeStats): stats is HunterPracticeStats =>
  stats.mode === GameModeId.Hunter
