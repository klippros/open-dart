import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode.ts'
import type { GameSession } from '@open-dart/game/types/gameSession.ts'
import type { DartThrow } from '@open-dart/game/types/dart.ts'
import type { Visit } from '@open-dart/game/types/visit.ts'
import { JdcChallengeGrade, JdcChallengePart } from '@open-dart/game/types/jdcChallenge.ts'
import {
  getJdcChallengeGrade,
  getJdcChallengeGradeLabel,
  JDC_CHALLENGE_VISIT_COUNT,
  resolveJdcChallengeVisit,
} from '@open-dart/game/jdcChallenge/jdcChallengeRules.ts'
import { getPlayerVisits, getPrimaryPlayerVisits } from './visitStats.ts'

export interface JdcChallengeLiveStats {
  score: number
  shanghaiLowScore: number
  doublesScore: number
  shanghaiHighScore: number
  shanghaisHit: number
  doublesHit: number
  visitsCompleted: number
  visitsRemaining: number
  grade: JdcChallengeGrade
  gradeLabel: string
}

export interface JdcChallengeLiveScoreMetric {
  label: string
  value: string
}

export interface JdcChallengeSingleSessionStats {
  score: number
  shanghaiLowScore: number
  doublesScore: number
  shanghaiHighScore: number
  shanghaisHit: number
  doublesHit: number
  grade: JdcChallengeGrade
  gradeLabel: string
  visits: Visit[]
  completed: boolean
}

const readNumberMetadata = (visit: Visit, key: string): number | null => {
  const value = visit.metadata?.[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

const readStringMetadata = (visit: Visit, key: string): string | null => {
  const value = visit.metadata?.[key]
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

const readBooleanMetadata = (visit: Visit, key: string): boolean => visit.metadata?.[key] === true

export const getJdcChallengeVisitShanghaiBonus = (visit: Visit): number =>
  readNumberMetadata(visit, 'shanghaiBonus') ?? 0

export const getJdcChallengeVisitIsShanghai = (visit: Visit): boolean =>
  readBooleanMetadata(visit, 'isShanghai')

export const getJdcChallengeVisitPart = (visit: Visit): JdcChallengePart | null => {
  const part = visit.metadata?.part
  if (
    part === JdcChallengePart.ShanghaiLow ||
    part === JdcChallengePart.Doubles ||
    part === JdcChallengePart.ShanghaiHigh
  ) {
    return part
  }
  return null
}

export const getJdcChallengeVisitTargetLabel = (visit: Visit): string | null =>
  readStringMetadata(visit, 'targetLabel')

export const getJdcChallengeVisitDartPoints = (visit: Visit): number[] => {
  const dartPoints = visit.metadata?.dartPoints
  if (!Array.isArray(dartPoints)) {
    return visit.darts.map(() => 0)
  }

  return dartPoints.map((value) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0,
  )
}

const emptyLiveStats = (): JdcChallengeLiveStats => ({
  score: 0,
  shanghaiLowScore: 0,
  doublesScore: 0,
  shanghaiHighScore: 0,
  shanghaisHit: 0,
  doublesHit: 0,
  visitsCompleted: 0,
  visitsRemaining: JDC_CHALLENGE_VISIT_COUNT,
  grade: JdcChallengeGrade.White,
  gradeLabel: getJdcChallengeGradeLabel(JdcChallengeGrade.White),
})

const statsFromLastVisit = (visit: Visit | undefined): JdcChallengeLiveStats => {
  if (visit === undefined) {
    return emptyLiveStats()
  }

  const score = visit.scoreAfter
  const grade = getJdcChallengeGrade(score)
  const visitsCompleted = visit.visitIndex + 1

  return {
    score,
    shanghaiLowScore: readNumberMetadata(visit, 'shanghaiLowScore') ?? 0,
    doublesScore: readNumberMetadata(visit, 'doublesScore') ?? 0,
    shanghaiHighScore: readNumberMetadata(visit, 'shanghaiHighScore') ?? 0,
    shanghaisHit: readNumberMetadata(visit, 'shanghaisHit') ?? 0,
    doublesHit: readNumberMetadata(visit, 'doublesHit') ?? 0,
    visitsCompleted,
    visitsRemaining: Math.max(0, JDC_CHALLENGE_VISIT_COUNT - visitsCompleted),
    grade,
    gradeLabel: getJdcChallengeGradeLabel(grade),
  }
}

export const getJdcChallengeLiveStats = (
  visits: Visit[],
  playerId: string,
  pendingDarts: DartThrow[] = [],
  includePending = true,
): JdcChallengeLiveStats => {
  const playerVisits = getPlayerVisits(visits, playerId)
  const base = statsFromLastVisit(playerVisits.at(-1))

  if (!includePending || pendingDarts.length === 0) {
    return base
  }

  const outcome = resolveJdcChallengeVisit(
    base.score,
    base.shanghaiLowScore,
    base.doublesScore,
    base.shanghaiHighScore,
    base.visitsCompleted,
    base.shanghaisHit,
    base.doublesHit,
    pendingDarts,
  )
  const grade = getJdcChallengeGrade(outcome.scoreAfter)

  return {
    score: outcome.scoreAfter,
    shanghaiLowScore: outcome.shanghaiLowScoreAfter,
    doublesScore: outcome.doublesScoreAfter,
    shanghaiHighScore: outcome.shanghaiHighScoreAfter,
    shanghaisHit: outcome.shanghaisHitAfter,
    doublesHit: outcome.doublesHitAfter,
    visitsCompleted: base.visitsCompleted,
    visitsRemaining: base.visitsRemaining,
    grade,
    gradeLabel: getJdcChallengeGradeLabel(grade),
  }
}

export const getJdcChallengeLiveScoreMetrics = (
  stats: JdcChallengeLiveStats,
): JdcChallengeLiveScoreMetric[] => [
  { label: 'Score', value: String(stats.score) },
  { label: 'Grade', value: stats.gradeLabel },
  { label: 'SH 10–15', value: String(stats.shanghaiLowScore) },
  { label: 'Doubles', value: String(stats.doublesScore) },
  { label: 'SH 15–20', value: String(stats.shanghaiHighScore) },
  {
    label: 'Shanghais',
    value: String(stats.shanghaisHit),
  },
]

export const computeJdcChallengeSingleSessionStats = (
  session: GameSession,
): JdcChallengeSingleSessionStats | null => {
  if (session.mode !== GameModeId.JdcChallenge) {
    return null
  }

  const visits = getPrimaryPlayerVisits(session)
  const lastVisit = visits.at(-1)
  const live = statsFromLastVisit(lastVisit)

  return {
    score: live.score,
    shanghaiLowScore: live.shanghaiLowScore,
    doublesScore: live.doublesScore,
    shanghaiHighScore: live.shanghaiHighScore,
    shanghaisHit: live.shanghaisHit,
    doublesHit: live.doublesHit,
    grade: live.grade,
    gradeLabel: live.gradeLabel,
    visits,
    completed: session.status === GameStatus.Completed && session.finishedEarly !== true,
  }
}
