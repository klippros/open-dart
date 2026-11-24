import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode.ts'
import type { GameSession } from '@open-dart/game/types/gameSession.ts'
import { PlayerKind } from '@open-dart/game/types/player.ts'
import {
  isBob27PracticeStats,
  isJdcChallengePracticeStats,
  isNinetyNineDartsPracticeStats,
  computeBigNumbersSummary,
  computePracticeStats,
} from './practiceStats.ts'
import { computeJdcChallengeSingleSessionStats } from './jdcChallengeVisitStats.ts'
import {
  filterBigNumbersSessions,
  filterFiveOhOneSessions,
  filterJdcChallengeSessions,
  filterNinetyNineDartsSessions,
} from './sessionScope.ts'
import type { JdcChallengeGrade } from '@open-dart/game/types/jdcChallenge.ts'
import { getSessionCompletedAt } from './sessionLabels.ts'
import { expandX01SessionsLegs } from './x01LegSlices.ts'
import { computeX01Stats } from './x01Stats.ts'
import { NinetyNineDartsStatGroup } from './ninetyNineVisitStats.ts'
import { getDateRangeCutoff } from './sessionFilters.ts'

export const PROFILE_STATS_VERSION = 2
export const PROFILE_ACTIVE_DAYS = 30

export interface ProfileStatWindow {
  startAt: string
  endAt: string
}

export interface ProfileFiveOhOneStats {
  legsPlayed: number
  threeDartAverage: number | null
  threeDartAverageUntil170: number | null
  checkoutPercent: number | null
  avgDarts: number | null
  bestDarts: number | null
  bestLegAverage: number | null
  bestLegDarts: number | null
  legWinRate: number | null
}

export interface ProfileBob27Stats {
  sessionsPlayed: number
  avgFinalScore: number | null
  hitRate: number | null
  bestFinalScore: number | null
  avgHitsPerVisit: number | null
  avgDoublesPerGame: number | null
  bestHitsPerVisit: number | null
  bestDoublesPerGame: number | null
}

export interface ProfileNinetyNineDartsGroupStats {
  group: NinetyNineDartsStatGroup
  sessionsPlayed: number
  avgFinalScore: number | null
  bestFinalScore: number | null
  hitRate: number | null
  avgTreblesPerGame: number | null
  avgSinglesPerGame: number | null
  avgDoublesPerGame: number | null
}

export interface ProfileNinetyNineDartsStats {
  groups: ProfileNinetyNineDartsGroupStats[]
}

export interface ProfileJdcChallengeBadge {
  score: number
  grade: JdcChallengeGrade
}

export interface ProfileJdcChallengeStats {
  sessionsPlayed: number
  avgFinalScore: number | null
  bestFinalScore: number | null
  avgShanghaisPerGame: number | null
  avgShanghaiLowScore: number | null
  avgDoublesScore: number | null
  avgShanghaiHighScore: number | null
  badge: ProfileJdcChallengeBadge | null
}

export interface ProfileBigNumbersStats {
  sessionsPlayed: number
  hitRate: number | null
  bestHitRate: number | null
}

export interface PlayerProfileStats {
  version: typeof PROFILE_STATS_VERSION
  displayName: string
  window: ProfileStatWindow
  fiveOhOne: ProfileFiveOhOneStats | null
  bob27: ProfileBob27Stats | null
  ninetyNineDarts: ProfileNinetyNineDartsStats | null
  bigNumbers: ProfileBigNumbersStats | null
  jdcChallenge: ProfileJdcChallengeStats | null
}

export interface BuildProfileStatsInput {
  displayName: string
  onlineSessions: GameSession[]
  practiceSessions: GameSession[]
  profileUserId: string
  /** Override "now" for the absolute 30-day window and jersey badge (tests). */
  now?: Date
}

const NINETY_NINE_GROUPS = [
  NinetyNineDartsStatGroup.Twenty,
  NinetyNineDartsStatGroup.Bull,
  NinetyNineDartsStatGroup.Other,
] as const

const isCompleted = (session: GameSession): boolean => session.status === GameStatus.Completed

const absoluteProfileWindow = (now: Date): ProfileStatWindow => {
  const startAt = getDateRangeCutoff('30d', now)
  if (startAt === null) {
    throw new Error('Expected a 30-day profile cutoff')
  }
  return { startAt, endAt: now.toISOString() }
}

const sessionsInWindow = (sessions: GameSession[], window: ProfileStatWindow): GameSession[] =>
  sessions.filter((session) => {
    const completedAt = getSessionCompletedAt(session)
    return completedAt >= window.startAt && completedAt <= window.endAt
  })

/** Orient an online session so the profile user is the primary Human player. */
export const orientSessionForProfileUser = (
  session: GameSession,
  profileUserId: string,
): GameSession => ({
  ...session,
  players: session.players.map((player) => ({
    ...player,
    kind: player.id === profileUserId ? PlayerKind.Human : PlayerKind.Remote,
  })),
})

const computeLegWinRate = (sessions: GameSession[], profileUserId: string): number | null => {
  let wins = 0
  let hasRecordedWins = false
  let legsPlayed = 0

  for (const session of sessions) {
    const progress = session.matchProgress
    if (progress === undefined) {
      continue
    }

    const playerWins = progress.legWins[profileUserId]
    if (typeof playerWins === 'number') {
      hasRecordedWins = true
      wins += playerWins
    }

    legsPlayed += expandX01SessionsLegs([session]).length
  }

  if (!hasRecordedWins || legsPlayed === 0) {
    return null
  }

  return (wins / legsPlayed) * 100
}

const checkoutPercent = (stats: {
  doubleCheckout: { attempts: number; successes: number }
  doubleCheckoutUnavailable: boolean
}): number | null => {
  if (stats.doubleCheckoutUnavailable || stats.doubleCheckout.attempts === 0) {
    return null
  }

  return (stats.doubleCheckout.successes / stats.doubleCheckout.attempts) * 100
}

const buildFiveOhOneStats = (
  onlineSessions: GameSession[],
  profileUserId: string,
  window: ProfileStatWindow,
): ProfileFiveOhOneStats | null => {
  const fiveOhOne = sessionsInWindow(
    filterFiveOhOneSessions(onlineSessions.filter(isCompleted)),
    window,
  )
  if (fiveOhOne.length === 0) {
    return null
  }

  const oriented = fiveOhOne.map((session) => orientSessionForProfileUser(session, profileUserId))
  const stats = computeX01Stats(oriented).fiveOhOne

  return {
    legsPlayed: stats.legCount,
    threeDartAverage: stats.threeDartAverage,
    threeDartAverageUntil170: stats.threeDartAverageUntil170,
    checkoutPercent: checkoutPercent(stats),
    avgDarts: stats.avgDarts,
    bestDarts: stats.bestDarts,
    bestLegAverage: stats.bestLegAverage,
    bestLegDarts: stats.bestLegDarts,
    legWinRate: computeLegWinRate(oriented, profileUserId),
  }
}

const buildBob27Stats = (
  practiceSessions: GameSession[],
  window: ProfileStatWindow,
): ProfileBob27Stats | null => {
  const windowSessions = sessionsInWindow(
    practiceSessions.filter((session) => isCompleted(session) && session.mode === GameModeId.Bob27),
    window,
  )
  if (windowSessions.length === 0) {
    return null
  }

  const practice = computePracticeStats(windowSessions).other.find(isBob27PracticeStats)
  if (practice === undefined) {
    return null
  }

  return {
    sessionsPlayed: practice.gameCount,
    avgFinalScore: practice.avgFinalScore,
    hitRate: practice.hitRate,
    bestFinalScore: practice.bestFinalScore,
    avgHitsPerVisit: practice.avgHitsPerVisit,
    avgDoublesPerGame: practice.avgDoublesPerGame,
    bestHitsPerVisit: practice.bestHitsPerVisit,
    bestDoublesPerGame: practice.bestDoublesPerGame,
  }
}

const buildNinetyNineDartsStats = (
  practiceSessions: GameSession[],
  window: ProfileStatWindow,
): ProfileNinetyNineDartsStats | null => {
  const modeSessions = sessionsInWindow(
    practiceSessions.filter(
      (session) => isCompleted(session) && session.mode === GameModeId.NinetyNineDarts,
    ),
    window,
  )
  if (modeSessions.length === 0) {
    return null
  }

  const groups = NINETY_NINE_GROUPS.flatMap((group) => {
    const groupSessions = filterNinetyNineDartsSessions(modeSessions, group)
    if (groupSessions.length === 0) {
      return []
    }

    const practice = computePracticeStats(groupSessions).other.find(isNinetyNineDartsPracticeStats)
    if (practice === undefined) {
      return []
    }

    return [
      {
        group,
        sessionsPlayed: practice.gameCount,
        avgFinalScore: practice.avgFinalScore,
        bestFinalScore: practice.bestFinalScore,
        hitRate: practice.hitRate,
        avgTreblesPerGame: practice.avgTreblesPerGame,
        avgSinglesPerGame: practice.avgSinglesPerGame,
        avgDoublesPerGame: practice.avgDoublesPerGame,
      },
    ]
  })

  if (groups.length === 0) {
    return null
  }

  return { groups }
}

const buildJdcChallengeBadge = (
  finishedSessions: GameSession[],
  now: Date,
): ProfileJdcChallengeBadge | null => {
  const cutoff = getDateRangeCutoff('30d', now)
  if (cutoff === null) {
    return null
  }

  const recent = finishedSessions
    .map((session) => {
      const stats = computeJdcChallengeSingleSessionStats(session)
      if (stats === null || !stats.completed) {
        return null
      }

      const completedAt = getSessionCompletedAt(session)
      if (completedAt < cutoff) {
        return null
      }

      return {
        score: stats.score,
        grade: stats.grade,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  if (recent.length === 0) {
    return null
  }

  return recent.reduce((best, entry) => (entry.score > best.score ? entry : best))
}

/** Best finished JDC Challenge score in the last 30 days. */
export const getRecentJdcChallengeBadge = (
  sessions: GameSession[],
  now: Date = new Date(),
): ProfileJdcChallengeBadge | null =>
  buildJdcChallengeBadge(
    filterJdcChallengeSessions(sessions).filter(
      (session) => isCompleted(session) && session.finishedEarly !== true,
    ),
    now,
  )

const buildBigNumbersStats = (
  practiceSessions: GameSession[],
  window: ProfileStatWindow,
): ProfileBigNumbersStats | null => {
  const windowSessions = sessionsInWindow(
    filterBigNumbersSessions(practiceSessions).filter(isCompleted),
    window,
  )
  if (windowSessions.length === 0) {
    return null
  }

  const summary = computeBigNumbersSummary(windowSessions)

  return {
    sessionsPlayed: summary.gameCount,
    hitRate: summary.hitRate,
    bestHitRate: summary.bestHitRate,
  }
}

const buildJdcChallengeStats = (
  practiceSessions: GameSession[],
  window: ProfileStatWindow,
  now: Date,
): ProfileJdcChallengeStats | null => {
  const modeSessions = filterJdcChallengeSessions(practiceSessions).filter(isCompleted)
  const finished = modeSessions.filter((session) => session.finishedEarly !== true)
  const badge = buildJdcChallengeBadge(finished, now)

  const windowSessions = sessionsInWindow(modeSessions, window)
  if (windowSessions.length === 0 && badge === null) {
    return null
  }

  const practice = computePracticeStats(windowSessions).other.find(isJdcChallengePracticeStats)

  return {
    sessionsPlayed: windowSessions.length,
    avgFinalScore: practice?.avgFinalScore ?? null,
    bestFinalScore: practice?.bestFinalScore ?? null,
    avgShanghaisPerGame: practice?.avgShanghaisPerGame ?? null,
    avgShanghaiLowScore: practice?.avgShanghaiLowScore ?? null,
    avgDoublesScore: practice?.avgDoublesScore ?? null,
    avgShanghaiHighScore: practice?.avgShanghaiHighScore ?? null,
    badge,
  }
}

export const buildProfileStats = (input: BuildProfileStatsInput): PlayerProfileStats => {
  const now = input.now ?? new Date()
  const window = absoluteProfileWindow(now)
  const online = input.onlineSessions
    .filter(isCompleted)
    .map((session) => orientSessionForProfileUser(session, input.profileUserId))
  const practice = input.practiceSessions.filter(isCompleted)

  return {
    version: PROFILE_STATS_VERSION,
    displayName: input.displayName,
    window,
    fiveOhOne: buildFiveOhOneStats(online, input.profileUserId, window),
    bob27: buildBob27Stats(practice, window),
    ninetyNineDarts: buildNinetyNineDartsStats(practice, window),
    bigNumbers: buildBigNumbersStats(practice, window),
    jdcChallenge: buildJdcChallengeStats(practice, window, now),
  }
}
