import type {
  PlayerProfileStats,
  ProfileBigNumbersStats,
  ProfileBob27Stats,
  ProfileFiveOhOneStats,
  ProfileJdcChallengeBadge,
  ProfileJdcChallengeStats,
  ProfileNinetyNineDartsGroupStats,
  ProfileNinetyNineDartsStats,
  ProfileStatWindow,
} from '@open-dart/analytics'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import { JdcChallengeGrade } from '@open-dart/game/types/jdcChallenge'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null

const readWindow = (value: unknown): ProfileStatWindow | null => {
  if (!isRecord(value)) {
    return null
  }
  if (typeof value.startAt !== 'string' || typeof value.endAt !== 'string') {
    return null
  }
  return { startAt: value.startAt, endAt: value.endAt }
}

const readFiveOhOne = (value: unknown): ProfileFiveOhOneStats | null => {
  if (!isRecord(value) || typeof value.legsPlayed !== 'number') {
    return null
  }
  return {
    legsPlayed: value.legsPlayed,
    threeDartAverage: readNumber(value.threeDartAverage),
    threeDartAverageUntil170: readNumber(value.threeDartAverageUntil170),
    checkoutPercent: readNumber(value.checkoutPercent),
    avgDarts: readNumber(value.avgDarts),
    bestLegAverage: readNumber(value.bestLegAverage),
    bestLegDarts: readNumber(value.bestLegDarts),
    legWinRate: readNumber(value.legWinRate),
  }
}

const readBob27 = (value: unknown): ProfileBob27Stats | null => {
  if (!isRecord(value) || typeof value.sessionsPlayed !== 'number') {
    return null
  }
  return {
    sessionsPlayed: value.sessionsPlayed,
    avgFinalScore: readNumber(value.avgFinalScore),
    hitRate: readNumber(value.hitRate),
    bestFinalScore: readNumber(value.bestFinalScore),
    avgHitsPerVisit: readNumber(value.avgHitsPerVisit),
    avgDoublesPerGame: readNumber(value.avgDoublesPerGame),
    bestHitsPerVisit: readNumber(value.bestHitsPerVisit),
    bestDoublesPerGame: readNumber(value.bestDoublesPerGame),
  }
}

const isNinetyNineGroup = (value: unknown): value is NinetyNineDartsStatGroup =>
  typeof value === 'string' && (Object.values(NinetyNineDartsStatGroup) as string[]).includes(value)

const readNinetyNineGroup = (value: unknown): ProfileNinetyNineDartsGroupStats | null => {
  if (
    !isRecord(value) ||
    !isNinetyNineGroup(value.group) ||
    typeof value.sessionsPlayed !== 'number'
  ) {
    return null
  }

  return {
    group: value.group,
    sessionsPlayed: value.sessionsPlayed,
    avgFinalScore: readNumber(value.avgFinalScore),
    bestFinalScore: readNumber(value.bestFinalScore),
    hitRate: readNumber(value.hitRate),
    avgTreblesPerGame: readNumber(value.avgTreblesPerGame),
    avgSinglesPerGame: readNumber(value.avgSinglesPerGame),
    avgDoublesPerGame: readNumber(value.avgDoublesPerGame),
  }
}

const readNinetyNine = (value: unknown): ProfileNinetyNineDartsStats | null => {
  if (!isRecord(value) || !Array.isArray(value.groups)) {
    return null
  }

  const groups = value.groups
    .map((group) => readNinetyNineGroup(group))
    .filter((group): group is ProfileNinetyNineDartsGroupStats => group !== null)

  if (groups.length === 0) {
    return null
  }

  return { groups }
}

const isJdcGrade = (value: unknown): value is JdcChallengeGrade =>
  typeof value === 'string' && (Object.values(JdcChallengeGrade) as string[]).includes(value)

const readJdcGrade = (value: unknown): JdcChallengeGrade | null =>
  isJdcGrade(value) ? value : null

const readJdcBadge = (value: unknown): ProfileJdcChallengeBadge | null => {
  if (!isRecord(value)) {
    return null
  }

  const score = readNumber(value.score)
  const grade = readJdcGrade(value.grade)

  if (score === null || grade === null) {
    return null
  }

  return {
    score,
    grade,
  }
}

const readJdcChallenge = (value: unknown): ProfileJdcChallengeStats | null => {
  if (!isRecord(value) || typeof value.sessionsPlayed !== 'number') {
    return null
  }

  const badge = value.badge === null || value.badge === undefined ? null : readJdcBadge(value.badge)

  return {
    sessionsPlayed: value.sessionsPlayed,
    avgFinalScore: readNumber(value.avgFinalScore),
    bestFinalScore: readNumber(value.bestFinalScore),
    avgShanghaisPerGame: readNumber(value.avgShanghaisPerGame),
    avgShanghaiLowScore: readNumber(value.avgShanghaiLowScore),
    avgDoublesScore: readNumber(value.avgDoublesScore),
    avgShanghaiHighScore: readNumber(value.avgShanghaiHighScore),
    badge,
  }
}

const readBigNumbers = (value: unknown): ProfileBigNumbersStats | null => {
  if (!isRecord(value) || typeof value.sessionsPlayed !== 'number') {
    return null
  }

  return {
    sessionsPlayed: value.sessionsPlayed,
    hitRate: readNumber(value.hitRate),
    bestHitRate: readNumber(value.bestHitRate),
  }
}

export const parsePlayerProfileStats = (value: unknown): PlayerProfileStats | null => {
  if (!isRecord(value) || value.version !== 2 || typeof value.displayName !== 'string') {
    return null
  }

  const window = readWindow(value.window)
  if (window === null) {
    return null
  }

  return {
    version: 2,
    displayName: value.displayName,
    window,
    fiveOhOne: value.fiveOhOne === null ? null : readFiveOhOne(value.fiveOhOne),
    bob27: value.bob27 === null ? null : readBob27(value.bob27),
    ninetyNineDarts: value.ninetyNineDarts === null ? null : readNinetyNine(value.ninetyNineDarts),
    bigNumbers:
      value.bigNumbers === null || value.bigNumbers === undefined
        ? null
        : readBigNumbers(value.bigNumbers),
    jdcChallenge:
      value.jdcChallenge === null || value.jdcChallenge === undefined
        ? null
        : readJdcChallenge(value.jdcChallenge),
  }
}
