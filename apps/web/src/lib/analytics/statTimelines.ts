import { GameModeId } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import type { AroundTheClockAimMode } from '@open-dart/game/types/aroundTheClock'
import type { BigNumbersRequiredHits } from '@open-dart/game/types/bigNumbers'
import type { Visit } from '@open-dart/game/types/visit'
import { getAroundTheClockConfig } from '@open-dart/game/aroundTheClock/aroundTheClockConfig'
import {
  getBob27AvgHitsPerVisit,
  getBob27SessionDoublesHit,
  getBob27VisitHitRate,
} from '@open-dart/analytics/bob27VisitStats'
import {
  getBigNumbersAvgHitsPerVisit,
  getBigNumbersHitRate,
  getBigNumbersSessionVisitCount,
} from '@open-dart/analytics/bigNumbersVisitStats'
import { computeBullRunSingleSessionStats } from '@open-dart/analytics/bullRunVisitStats'
import { computeHunterPrimaryPlayerStats } from '@open-dart/analytics/hunterVisitStats'
import { computeJdcChallengeSingleSessionStats } from '@open-dart/analytics/jdcChallengeVisitStats'
import { computeNinetyNineDartsSingleSessionStats } from '@open-dart/analytics/ninetyNineVisitStats'
import type { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import {
  getSessionCheckoutCount,
  getHighestOneTwentyOneCheckoutTarget,
  getOneTwentyOneCheckoutRate,
} from '@open-dart/analytics/oneTwentyOneVisitStats'
import { getSessionCompletedAt, getSessionModeLabel } from '../history/sessionSummary'
import { isAroundTheClockConfig, isX01Config } from '@open-dart/game/game/gameConfigGuards'
import { getDoubleCheckoutRate } from './formatAnalytics'
import { computePlayerStatsForVisits } from './matchPlayerStats'
import {
  filterAllX01Sessions,
  filterAroundTheClockSessions,
  filterBigNumbersSessions,
  filterBob27Sessions,
  filterBullRunSessions,
  filterCheckoutPracticeSessions,
  filterFiveOhOneSessions,
  filterHunterSessions,
  filterJdcChallengeSessions,
  filterNinetyNineDartsSessions,
  filterOneSeventySessions,
} from '@open-dart/analytics/sessionScope'
import {
  countDartsInSession,
  getHighestCheckout,
  getPrimaryPlayerVisits,
  getScoringVisits,
  getSessionCheckoutRate,
  getSessionFinalScore,
  getThreeDartAverage,
} from '@open-dart/analytics/visitStats'
import {
  countDartsInVisits,
  expandX01SessionLegs,
  getX01LegSlicePointId,
  legFinishedWithCheckout,
} from '@open-dart/analytics/x01LegSlices'
import type { X01LegSlice } from '@open-dart/analytics/x01LegSlices'

export type StatMetricId =
  | 'threeDartAverage'
  | 'threeDartAverageUntil170'
  | 'threeDartAverageUntilDouble'
  | 'bestLegAverage'
  | 'thrown180'
  | 'thrown140Plus'
  | 'thrown100Plus'
  | 'highestVisit'
  | 'doubleCheckoutRate'
  | 'checkouts100Plus'
  | 'highestCheckout'
  | 'checkoutRate'
  | 'avgCheckoutsPerGame'
  | 'bestCheckoutsPerGame'
  | 'avgDarts'
  | 'avgFinalScore'
  | 'bestFinalScore'
  | 'hitRate'
  | 'bestHitRate'
  | 'avgHitsPerVisit'
  | 'avgAdvancesPerVisit'
  | 'avgDoublesPerGame'
  | 'bestDoublesPerGame'
  | 'avgSinglesPerGame'
  | 'avgTreblesPerGame'
  | 'bestDarts'
  | 'completionRate'
  | 'singlesPerThreeDarts'
  | 'doublesPerThreeDarts'
  | 'avgPerThreeDarts'
  | 'avgVisitsToComplete'
  | 'bestVisitsToComplete'
  | 'avgShanghaisPerGame'
  | 'bestShanghaisPerGame'
  | 'avgShanghaiLowScore'
  | 'avgDoublesScore'
  | 'avgShanghaiHighScore'

export type StatTimelineScope =
  | { type: 'x01-501' }
  | { type: 'x01-170' }
  | { type: 'x01-all' }
  | { type: 'practice-checkout'; mode: GameModeId.OneTwentyOne | GameModeId.TenUpOneDown }
  | { type: 'practice-bob27' }
  | { type: 'practice-around-the-clock'; aimMode?: AroundTheClockAimMode }
  | { type: 'practice-99-darts'; group: NinetyNineDartsStatGroup }
  | { type: 'practice-bull-run' }
  | { type: 'practice-big-numbers'; requiredHits?: BigNumbersRequiredHits }
  | { type: 'practice-jdc-challenge' }
  | { type: 'practice-hunter' }

export interface StatTimelineSelection {
  scope: StatTimelineScope
  metric: StatMetricId
  metricLabel: string
  scopeLabel: string
  checkedOutOnly?: boolean
}

export type StatTimelineFormat = 'average' | 'percent' | 'wholePercent' | 'integer' | 'count'

export interface StatTimelinePoint {
  sessionId: string
  completedAt: string
  sessionLabel: string
  value: number | null
}

export interface StatTimeline {
  metricLabel: string
  scopeLabel: string
  format: StatTimelineFormat
  pointUnitLabel: 'leg' | 'session'
  points: StatTimelinePoint[]
}

const getX01PlayerStatsForVisits = (session: GameSession, visits: Visit[]) => {
  if (!isX01Config(session.mode, session.config)) {
    return null
  }

  return computePlayerStatsForVisits(
    visits,
    {
      doubleIn: session.config.doubleIn,
      doubleOut: session.config.doubleOut,
    },
    session.config.doubleIn,
  )
}

const getX01LegMetric = (slice: X01LegSlice, metric: StatMetricId): number | null => {
  const { visits, session } = slice
  const playerStats = getX01PlayerStatsForVisits(session, visits)

  switch (metric) {
    case 'threeDartAverage':
    case 'bestLegAverage':
      return getThreeDartAverage(visits)
    case 'threeDartAverageUntil170':
      return getThreeDartAverage(getScoringVisits(visits))
    case 'threeDartAverageUntilDouble':
      return playerStats?.threeDartAverageUntilDouble ?? null
    case 'thrown180':
      return playerStats?.thrown180 ?? null
    case 'thrown140Plus':
      return playerStats?.thrown140Plus ?? null
    case 'thrown100Plus':
      return playerStats?.thrown100Plus ?? null
    case 'highestVisit':
      return playerStats?.highestVisit ?? null
    case 'doubleCheckoutRate':
      return getDoubleCheckoutRate(playerStats?.doubleCheckout ?? { attempts: 0, successes: 0 })
    case 'checkouts100Plus':
      return playerStats?.checkouts100Plus ?? null
    case 'highestCheckout':
      return playerStats?.highestCheckout ?? null
    case 'avgDarts':
      return legFinishedWithCheckout(visits) ? countDartsInVisits(visits) : null
    case 'checkoutRate':
    case 'avgCheckoutsPerGame':
    case 'bestCheckoutsPerGame':
    case 'avgFinalScore':
    case 'bestFinalScore':
    case 'hitRate':
    case 'bestHitRate':
    case 'avgHitsPerVisit':
    case 'avgAdvancesPerVisit':
    case 'avgDoublesPerGame':
    case 'bestDoublesPerGame':
    case 'avgSinglesPerGame':
    case 'avgTreblesPerGame':
    case 'bestDarts':
    case 'completionRate':
    case 'singlesPerThreeDarts':
    case 'doublesPerThreeDarts':
    case 'avgPerThreeDarts':
    case 'avgVisitsToComplete':
    case 'bestVisitsToComplete':
    case 'avgShanghaisPerGame':
    case 'bestShanghaisPerGame':
    case 'avgShanghaiLowScore':
    case 'avgDoublesScore':
    case 'avgShanghaiHighScore':
      return null
  }

  return null
}

const getX01LegSessionLabel = (slice: X01LegSlice, legCountInSession: number): string => {
  const modeLabel = getSessionModeLabel(slice.session)

  if (legCountInSession <= 1) {
    return modeLabel
  }

  return `${modeLabel} · Leg ${slice.legNumber}`
}

const getCheckoutPracticeSessionMetric = (
  session: GameSession,
  metric: StatMetricId,
): number | null => {
  switch (metric) {
    case 'checkoutRate':
      return session.mode === GameModeId.OneTwentyOne
        ? getOneTwentyOneCheckoutRate(getPrimaryPlayerVisits(session))
        : getSessionCheckoutRate(session)
    case 'threeDartAverage':
      return getThreeDartAverage(getPrimaryPlayerVisits(session))
    case 'avgCheckoutsPerGame':
    case 'bestCheckoutsPerGame':
      return getSessionCheckoutCount(session)
    case 'highestCheckout':
      return session.mode === GameModeId.OneTwentyOne
        ? getHighestOneTwentyOneCheckoutTarget(getPrimaryPlayerVisits(session))
        : getHighestCheckout(getPrimaryPlayerVisits(session))
    case 'threeDartAverageUntil170':
    case 'threeDartAverageUntilDouble':
    case 'bestLegAverage':
    case 'thrown180':
    case 'thrown140Plus':
    case 'thrown100Plus':
    case 'highestVisit':
    case 'doubleCheckoutRate':
    case 'checkouts100Plus':
    case 'avgDarts':
    case 'avgFinalScore':
    case 'bestFinalScore':
    case 'hitRate':
    case 'bestHitRate':
    case 'avgHitsPerVisit':
    case 'avgAdvancesPerVisit':
    case 'avgDoublesPerGame':
    case 'bestDoublesPerGame':
    case 'avgSinglesPerGame':
    case 'avgTreblesPerGame':
    case 'bestDarts':
    case 'completionRate':
    case 'singlesPerThreeDarts':
    case 'doublesPerThreeDarts':
    case 'avgPerThreeDarts':
    case 'avgVisitsToComplete':
    case 'bestVisitsToComplete':
    case 'avgShanghaisPerGame':
    case 'bestShanghaisPerGame':
    case 'avgShanghaiLowScore':
    case 'avgDoublesScore':
    case 'avgShanghaiHighScore':
      return null
  }

  return null
}

const getBob27SessionMetric = (session: GameSession, metric: StatMetricId): number | null => {
  switch (metric) {
    case 'hitRate':
      return getBob27VisitHitRate(getPrimaryPlayerVisits(session))
    case 'avgHitsPerVisit':
      return getBob27AvgHitsPerVisit(getPrimaryPlayerVisits(session))
    case 'avgFinalScore':
    case 'bestFinalScore':
      return getSessionFinalScore(session)
    case 'avgDoublesPerGame':
    case 'bestDoublesPerGame':
      return getBob27SessionDoublesHit(session)
    case 'threeDartAverage':
    case 'threeDartAverageUntil170':
    case 'threeDartAverageUntilDouble':
    case 'bestLegAverage':
    case 'thrown180':
    case 'thrown140Plus':
    case 'thrown100Plus':
    case 'highestVisit':
    case 'doubleCheckoutRate':
    case 'checkouts100Plus':
    case 'highestCheckout':
    case 'avgDarts':
    case 'bestDarts':
    case 'completionRate':
    case 'checkoutRate':
    case 'avgCheckoutsPerGame':
    case 'bestCheckoutsPerGame':
    case 'bestHitRate':
    case 'avgAdvancesPerVisit':
    case 'avgSinglesPerGame':
    case 'avgTreblesPerGame':
    case 'singlesPerThreeDarts':
    case 'doublesPerThreeDarts':
    case 'avgPerThreeDarts':
    case 'avgVisitsToComplete':
    case 'bestVisitsToComplete':
    case 'avgShanghaisPerGame':
    case 'bestShanghaisPerGame':
    case 'avgShanghaiLowScore':
    case 'avgDoublesScore':
    case 'avgShanghaiHighScore':
      return null
  }

  return null
}

const getAroundTheClockSessionMetric = (
  session: GameSession,
  metric: StatMetricId,
  aimMode?: AroundTheClockAimMode,
): number | null => {
  if (
    aimMode !== undefined &&
    (!isAroundTheClockConfig(session.mode, session.config) ||
      getAroundTheClockConfig(session.config).aimMode !== aimMode)
  ) {
    return null
  }

  const dartCount = countDartsInSession(session)
  const isCompleted = session.finishedEarly !== true

  switch (metric) {
    case 'completionRate':
      return isCompleted ? 100 : 0
    case 'avgDarts':
      return isCompleted ? dartCount : null
    case 'bestDarts':
      return isCompleted ? dartCount : null
    case 'threeDartAverage':
    case 'threeDartAverageUntil170':
    case 'threeDartAverageUntilDouble':
    case 'bestLegAverage':
    case 'thrown180':
    case 'thrown140Plus':
    case 'thrown100Plus':
    case 'highestVisit':
    case 'doubleCheckoutRate':
    case 'checkouts100Plus':
    case 'highestCheckout':
    case 'checkoutRate':
    case 'avgCheckoutsPerGame':
    case 'bestCheckoutsPerGame':
    case 'avgFinalScore':
    case 'bestFinalScore':
    case 'hitRate':
    case 'bestHitRate':
    case 'avgHitsPerVisit':
    case 'avgAdvancesPerVisit':
    case 'avgDoublesPerGame':
    case 'bestDoublesPerGame':
    case 'avgSinglesPerGame':
    case 'avgTreblesPerGame':
    case 'singlesPerThreeDarts':
    case 'doublesPerThreeDarts':
    case 'avgPerThreeDarts':
    case 'avgVisitsToComplete':
    case 'bestVisitsToComplete':
    case 'avgShanghaisPerGame':
    case 'bestShanghaisPerGame':
    case 'avgShanghaiLowScore':
    case 'avgDoublesScore':
    case 'avgShanghaiHighScore':
      return null
  }

  return null
}

const getNinetyNineDartsSessionMetric = (
  session: GameSession,
  metric: StatMetricId,
): number | null => {
  const stats = computeNinetyNineDartsSingleSessionStats(session)

  if (stats === null) {
    return null
  }

  switch (metric) {
    case 'hitRate':
      return stats.hitRate
    case 'avgFinalScore':
    case 'bestFinalScore':
      return stats.score
    case 'avgSinglesPerGame':
      return stats.counts.singles
    case 'avgDoublesPerGame':
      return stats.counts.doubles
    case 'avgTreblesPerGame':
      return stats.isBull ? null : stats.counts.trebles
    case 'threeDartAverage':
    case 'threeDartAverageUntil170':
    case 'threeDartAverageUntilDouble':
    case 'bestLegAverage':
    case 'thrown180':
    case 'thrown140Plus':
    case 'thrown100Plus':
    case 'highestVisit':
    case 'doubleCheckoutRate':
    case 'checkouts100Plus':
    case 'highestCheckout':
    case 'checkoutRate':
    case 'avgCheckoutsPerGame':
    case 'bestCheckoutsPerGame':
    case 'avgDarts':
    case 'bestDarts':
    case 'completionRate':
    case 'bestHitRate':
    case 'avgHitsPerVisit':
    case 'avgAdvancesPerVisit':
    case 'bestDoublesPerGame':
    case 'singlesPerThreeDarts':
    case 'doublesPerThreeDarts':
    case 'avgPerThreeDarts':
    case 'avgVisitsToComplete':
    case 'bestVisitsToComplete':
    case 'avgShanghaisPerGame':
    case 'bestShanghaisPerGame':
    case 'avgShanghaiLowScore':
    case 'avgDoublesScore':
    case 'avgShanghaiHighScore':
      return null
  }

  return null
}

const getBullRunSessionMetric = (session: GameSession, metric: StatMetricId): number | null => {
  const stats = computeBullRunSingleSessionStats(session)

  if (stats === null) {
    return null
  }

  switch (metric) {
    case 'hitRate':
      return stats.hitRate
    case 'singlesPerThreeDarts':
      return stats.singlesPerThreeDarts
    case 'doublesPerThreeDarts':
      return stats.doublesPerThreeDarts
    case 'avgPerThreeDarts':
      return stats.avgPerThreeDarts
    case 'threeDartAverage':
    case 'threeDartAverageUntil170':
    case 'threeDartAverageUntilDouble':
    case 'bestLegAverage':
    case 'thrown180':
    case 'thrown140Plus':
    case 'thrown100Plus':
    case 'highestVisit':
    case 'doubleCheckoutRate':
    case 'checkouts100Plus':
    case 'highestCheckout':
    case 'checkoutRate':
    case 'avgCheckoutsPerGame':
    case 'bestCheckoutsPerGame':
    case 'avgDarts':
    case 'avgFinalScore':
    case 'bestFinalScore':
    case 'bestHitRate':
    case 'avgHitsPerVisit':
    case 'avgAdvancesPerVisit':
    case 'avgDoublesPerGame':
    case 'bestDoublesPerGame':
    case 'avgSinglesPerGame':
    case 'avgTreblesPerGame':
    case 'bestDarts':
    case 'completionRate':
    case 'avgVisitsToComplete':
    case 'bestVisitsToComplete':
    case 'avgShanghaisPerGame':
    case 'bestShanghaisPerGame':
    case 'avgShanghaiLowScore':
    case 'avgDoublesScore':
    case 'avgShanghaiHighScore':
      return null
  }

  return null
}

const getJdcChallengeSessionMetric = (
  session: GameSession,
  metric: StatMetricId,
): number | null => {
  const stats = computeJdcChallengeSingleSessionStats(session)

  if (stats === null || !stats.completed) {
    return null
  }

  switch (metric) {
    case 'avgFinalScore':
    case 'bestFinalScore':
      return stats.score
    case 'avgShanghaiLowScore':
      return stats.shanghaiLowScore
    case 'avgDoublesScore':
      return stats.doublesScore
    case 'avgShanghaiHighScore':
      return stats.shanghaiHighScore
    case 'avgShanghaisPerGame':
    case 'bestShanghaisPerGame':
      return stats.shanghaisHit
    case 'threeDartAverage':
    case 'threeDartAverageUntil170':
    case 'threeDartAverageUntilDouble':
    case 'bestLegAverage':
    case 'thrown180':
    case 'thrown140Plus':
    case 'thrown100Plus':
    case 'highestVisit':
    case 'doubleCheckoutRate':
    case 'checkouts100Plus':
    case 'highestCheckout':
    case 'checkoutRate':
    case 'avgCheckoutsPerGame':
    case 'bestCheckoutsPerGame':
    case 'avgDarts':
    case 'hitRate':
    case 'bestHitRate':
    case 'avgHitsPerVisit':
    case 'avgAdvancesPerVisit':
    case 'avgDoublesPerGame':
    case 'bestDoublesPerGame':
    case 'avgSinglesPerGame':
    case 'avgTreblesPerGame':
    case 'bestDarts':
    case 'completionRate':
    case 'singlesPerThreeDarts':
    case 'doublesPerThreeDarts':
    case 'avgPerThreeDarts':
    case 'avgVisitsToComplete':
    case 'bestVisitsToComplete':
      return null
  }

  return null
}

const getBigNumbersSessionMetric = (session: GameSession, metric: StatMetricId): number | null => {
  const visits = getPrimaryPlayerVisits(session)
  const completed = session.finishedEarly !== true
  const visitCount = getBigNumbersSessionVisitCount(session)

  switch (metric) {
    case 'avgHitsPerVisit':
      return getBigNumbersAvgHitsPerVisit(visits)
    case 'hitRate':
    case 'bestHitRate':
      return getBigNumbersHitRate(visits)
    case 'avgVisitsToComplete':
    case 'bestVisitsToComplete':
      return completed ? visitCount : null
    case 'avgShanghaisPerGame':
    case 'bestShanghaisPerGame':
    case 'avgShanghaiLowScore':
    case 'avgDoublesScore':
    case 'avgShanghaiHighScore':
    case 'threeDartAverage':
    case 'threeDartAverageUntil170':
    case 'threeDartAverageUntilDouble':
    case 'bestLegAverage':
    case 'thrown180':
    case 'thrown140Plus':
    case 'thrown100Plus':
    case 'highestVisit':
    case 'doubleCheckoutRate':
    case 'checkouts100Plus':
    case 'highestCheckout':
    case 'checkoutRate':
    case 'avgCheckoutsPerGame':
    case 'bestCheckoutsPerGame':
    case 'avgDarts':
    case 'avgFinalScore':
    case 'bestFinalScore':
    case 'avgAdvancesPerVisit':
    case 'avgDoublesPerGame':
    case 'bestDoublesPerGame':
    case 'avgSinglesPerGame':
    case 'avgTreblesPerGame':
    case 'bestDarts':
    case 'completionRate':
    case 'singlesPerThreeDarts':
    case 'doublesPerThreeDarts':
    case 'avgPerThreeDarts':
      return null
  }

  return null
}

const getHunterSessionMetric = (session: GameSession, metric: StatMetricId): number | null => {
  const stats = computeHunterPrimaryPlayerStats(session)

  if (stats === null) {
    return null
  }

  switch (metric) {
    case 'hitRate':
      return stats.hitRate
    case 'avgAdvancesPerVisit':
      return stats.avgAdvancesPerVisit
    case 'threeDartAverage':
    case 'threeDartAverageUntil170':
    case 'threeDartAverageUntilDouble':
    case 'bestLegAverage':
    case 'thrown180':
    case 'thrown140Plus':
    case 'thrown100Plus':
    case 'highestVisit':
    case 'doubleCheckoutRate':
    case 'checkouts100Plus':
    case 'highestCheckout':
    case 'checkoutRate':
    case 'avgCheckoutsPerGame':
    case 'bestCheckoutsPerGame':
    case 'avgDarts':
    case 'avgFinalScore':
    case 'bestFinalScore':
    case 'bestHitRate':
    case 'avgHitsPerVisit':
    case 'avgDoublesPerGame':
    case 'bestDoublesPerGame':
    case 'avgSinglesPerGame':
    case 'avgTreblesPerGame':
    case 'bestDarts':
    case 'completionRate':
    case 'singlesPerThreeDarts':
    case 'doublesPerThreeDarts':
    case 'avgPerThreeDarts':
    case 'avgVisitsToComplete':
    case 'bestVisitsToComplete':
    case 'avgShanghaisPerGame':
    case 'bestShanghaisPerGame':
    case 'avgShanghaiLowScore':
    case 'avgDoublesScore':
    case 'avgShanghaiHighScore':
      return null
  }

  return null
}

export const getStatTimelineFormat = (metric: StatMetricId): StatTimelineFormat => {
  switch (metric) {
    case 'checkoutRate':
    case 'doubleCheckoutRate':
      return 'wholePercent'
    case 'completionRate':
    case 'hitRate':
    case 'bestHitRate':
      return 'percent'
    case 'avgDarts':
    case 'avgFinalScore':
    case 'bestFinalScore':
    case 'bestDarts':
    case 'bestDoublesPerGame':
    case 'bestCheckoutsPerGame':
    case 'bestVisitsToComplete':
    case 'bestShanghaisPerGame':
    case 'thrown180':
    case 'thrown140Plus':
    case 'thrown100Plus':
    case 'highestVisit':
    case 'checkouts100Plus':
    case 'highestCheckout':
      return 'integer'
    case 'threeDartAverage':
    case 'threeDartAverageUntil170':
    case 'threeDartAverageUntilDouble':
    case 'bestLegAverage':
    case 'avgDoublesPerGame':
    case 'avgCheckoutsPerGame':
    case 'avgHitsPerVisit':
    case 'avgAdvancesPerVisit':
    case 'avgSinglesPerGame':
    case 'avgTreblesPerGame':
    case 'singlesPerThreeDarts':
    case 'doublesPerThreeDarts':
    case 'avgPerThreeDarts':
    case 'avgVisitsToComplete':
    case 'avgShanghaisPerGame':
    case 'avgShanghaiLowScore':
    case 'avgDoublesScore':
    case 'avgShanghaiHighScore':
      return 'average'
  }

  return 'average'
}

const filterSessionsForScope = (
  sessions: GameSession[],
  scope: StatTimelineScope,
): GameSession[] => {
  switch (scope.type) {
    case 'x01-501':
      return filterFiveOhOneSessions(sessions)
    case 'x01-170':
      return filterOneSeventySessions(sessions)
    case 'x01-all':
      return filterAllX01Sessions(sessions)
    case 'practice-checkout':
      return filterCheckoutPracticeSessions(sessions, scope.mode)
    case 'practice-bob27':
      return filterBob27Sessions(sessions)
    case 'practice-around-the-clock':
      return filterAroundTheClockSessions(sessions, scope.aimMode)
    case 'practice-99-darts':
      return filterNinetyNineDartsSessions(sessions, scope.group)
    case 'practice-bull-run':
      return filterBullRunSessions(sessions)
    case 'practice-big-numbers':
      return filterBigNumbersSessions(sessions, scope.requiredHits)
    case 'practice-jdc-challenge':
      return filterJdcChallengeSessions(sessions)
    case 'practice-hunter':
      return filterHunterSessions(sessions)
    default:
      return []
  }
}

const isX01TimelineScope = (scope: StatTimelineScope): boolean =>
  scope.type === 'x01-501' || scope.type === 'x01-170' || scope.type === 'x01-all'

const buildX01TimelinePoints = (
  sessions: GameSession[],
  metric: StatMetricId,
  checkedOutOnly: boolean,
): StatTimelinePoint[] => {
  const points = sessions.flatMap((session) => {
    const legs = expandX01SessionLegs(session)
    const includedLegs = checkedOutOnly
      ? legs.filter((slice) => legFinishedWithCheckout(slice.visits))
      : legs

    return includedLegs.map((slice) => ({
      sessionId: getX01LegSlicePointId(slice),
      completedAt: getSessionCompletedAt(session),
      sessionLabel: getX01LegSessionLabel(slice, legs.length),
      value: getX01LegMetric(slice, metric),
      legNumber: slice.legNumber,
    }))
  })

  return points
    .sort((left, right) => {
      const byCompletedAt = left.completedAt.localeCompare(right.completedAt)

      if (byCompletedAt !== 0) {
        return byCompletedAt
      }

      return left.legNumber - right.legNumber
    })
    .map(({ sessionId, completedAt, sessionLabel, value }) => ({
      sessionId,
      completedAt,
      sessionLabel,
      value,
    }))
}

const getPracticeSessionMetricValue = (
  session: GameSession,
  selection: StatTimelineSelection,
): number | null => {
  if (selection.scope.type === 'practice-checkout') {
    return getCheckoutPracticeSessionMetric(session, selection.metric)
  }

  if (selection.scope.type === 'practice-bob27') {
    return getBob27SessionMetric(session, selection.metric)
  }

  if (selection.scope.type === 'practice-around-the-clock') {
    return getAroundTheClockSessionMetric(session, selection.metric, selection.scope.aimMode)
  }

  if (selection.scope.type === 'practice-99-darts') {
    return getNinetyNineDartsSessionMetric(session, selection.metric)
  }

  if (selection.scope.type === 'practice-bull-run') {
    return getBullRunSessionMetric(session, selection.metric)
  }

  if (selection.scope.type === 'practice-big-numbers') {
    return getBigNumbersSessionMetric(session, selection.metric)
  }

  if (selection.scope.type === 'practice-jdc-challenge') {
    return getJdcChallengeSessionMetric(session, selection.metric)
  }

  if (selection.scope.type === 'practice-hunter') {
    return getHunterSessionMetric(session, selection.metric)
  }

  return null
}

export const buildStatTimeline = (
  sessions: GameSession[],
  selection: StatTimelineSelection,
): StatTimeline => {
  const scopedSessions = filterSessionsForScope(sessions, selection.scope)

  if (isX01TimelineScope(selection.scope)) {
    return {
      metricLabel: selection.metricLabel,
      scopeLabel: selection.scopeLabel,
      format: getStatTimelineFormat(selection.metric),
      pointUnitLabel: 'leg',
      points: buildX01TimelinePoints(
        scopedSessions,
        selection.metric,
        selection.checkedOutOnly === true,
      ),
    }
  }

  const sortedSessions = [...scopedSessions].sort((left, right) =>
    getSessionCompletedAt(left).localeCompare(getSessionCompletedAt(right)),
  )

  return {
    metricLabel: selection.metricLabel,
    scopeLabel: selection.scopeLabel,
    format: getStatTimelineFormat(selection.metric),
    pointUnitLabel: 'session',
    points: sortedSessions.map((session) => ({
      sessionId: session.id,
      completedAt: getSessionCompletedAt(session),
      sessionLabel: getSessionModeLabel(session),
      value: getPracticeSessionMetricValue(session, selection),
    })),
  }
}

export const hasPlottableTimeline = (timeline: StatTimeline): boolean =>
  timeline.points.some((point) => point.value !== null)
