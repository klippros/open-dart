import { DartMultiplier } from '../types/dart.ts'
import type { DartThrow } from '../types/dart.ts'
import {
  JdcChallengeDoubleOutcome,
  JdcChallengeGrade,
  JdcChallengePart,
  JdcChallengeShanghaiOutcome,
  JdcChallengeTargetKind,
} from '../types/jdcChallenge.ts'
import type { JdcChallengeTarget } from '../types/jdcChallenge.ts'
import {
  hitsBull,
  hitsDoubleOnNumber,
  hitsNumberSegment,
  hitsSingleOnNumber,
  hitsTripleOnNumber,
} from '../segmentMatching.ts'

export const JDC_CHALLENGE_VISIT_COUNT = 19
export const JDC_CHALLENGE_MAX_DARTS_PER_VISIT = 3
export const JDC_CHALLENGE_SHANGHAI_BONUS = 100
export const JDC_CHALLENGE_DOUBLE_POINTS = 50
export const JDC_CHALLENGE_BULL_POINTS = 100
export const JDC_CHALLENGE_MAX_SHANGHAIS = 12
export const JDC_CHALLENGE_MAX_SCORE = 3380

export const JDC_CHALLENGE_SHANGHAI_LOW_TARGETS = [10, 11, 12, 13, 14, 15] as const
export const JDC_CHALLENGE_SHANGHAI_HIGH_TARGETS = [15, 16, 17, 18, 19, 20] as const
export const JDC_CHALLENGE_DOUBLE_TARGETS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
] as const

export interface JdcChallengeGradeBand {
  grade: JdcChallengeGrade
  minScore: number
  maxScore: number | null
  label: string
}

export const JDC_CHALLENGE_GRADE_BANDS: readonly JdcChallengeGradeBand[] = [
  { grade: JdcChallengeGrade.White, minScore: 0, maxScore: 149, label: 'White' },
  { grade: JdcChallengeGrade.Purple, minScore: 150, maxScore: 299, label: 'Purple' },
  { grade: JdcChallengeGrade.Yellow, minScore: 300, maxScore: 449, label: 'Yellow' },
  { grade: JdcChallengeGrade.Green, minScore: 450, maxScore: 599, label: 'Green' },
  { grade: JdcChallengeGrade.Blue, minScore: 600, maxScore: 699, label: 'Blue' },
  { grade: JdcChallengeGrade.Red, minScore: 700, maxScore: 849, label: 'Red' },
  { grade: JdcChallengeGrade.Black, minScore: 850, maxScore: 1249, label: 'Black' },
  { grade: JdcChallengeGrade.Gold, minScore: 1250, maxScore: null, label: 'Gold' },
]

export const getJdcChallengeGrade = (score: number): JdcChallengeGrade => {
  for (let index = JDC_CHALLENGE_GRADE_BANDS.length - 1; index >= 0; index -= 1) {
    const band = JDC_CHALLENGE_GRADE_BANDS[index]
    if (band !== undefined && score >= band.minScore) {
      return band.grade
    }
  }

  return JdcChallengeGrade.White
}

export const getJdcChallengeGradeBand = (grade: JdcChallengeGrade): JdcChallengeGradeBand => {
  const band = JDC_CHALLENGE_GRADE_BANDS.find((entry) => entry.grade === grade)

  if (band === undefined) {
    throw new Error(`Unknown JDC grade: ${grade}`)
  }

  return band
}

export const getJdcChallengeGradeLabel = (grade: JdcChallengeGrade): string =>
  getJdcChallengeGradeBand(grade).label

export const getJdcChallengeGradeRank = (grade: JdcChallengeGrade): number =>
  JDC_CHALLENGE_GRADE_BANDS.findIndex((band) => band.grade === grade)

export const isHigherJdcChallengeGrade = (
  candidate: JdcChallengeGrade,
  current: JdcChallengeGrade,
): boolean => getJdcChallengeGradeRank(candidate) > getJdcChallengeGradeRank(current)

export const getJdcChallengeVisitIndex = (visitsCompleted: number): number =>
  Math.min(Math.max(0, visitsCompleted), JDC_CHALLENGE_VISIT_COUNT - 1)

export const getJdcChallengePartForVisit = (visitIndex: number): JdcChallengePart => {
  if (visitIndex < 6) {
    return JdcChallengePart.ShanghaiLow
  }

  if (visitIndex < 13) {
    return JdcChallengePart.Doubles
  }

  return JdcChallengePart.ShanghaiHigh
}

export const getJdcChallengeTargetForVisit = (visitIndex: number): JdcChallengeTarget => {
  const clamped = getJdcChallengeVisitIndex(visitIndex)

  if (clamped < 6) {
    const value = JDC_CHALLENGE_SHANGHAI_LOW_TARGETS[clamped]
    return { kind: JdcChallengeTargetKind.Shanghai, value: value ?? 10 }
  }

  if (clamped < 13) {
    const doublesVisit = clamped - 6
    const dartOffset = doublesVisit * 3

    // Target for the visit as a whole is the first dart target; per-dart targets
    // are resolved separately for the doubles part.
    if (dartOffset >= 20) {
      return { kind: JdcChallengeTargetKind.Bull }
    }

    const value = JDC_CHALLENGE_DOUBLE_TARGETS[dartOffset]
    return { kind: JdcChallengeTargetKind.Double, value: value ?? 1 }
  }

  const highIndex = clamped - 13
  const value = JDC_CHALLENGE_SHANGHAI_HIGH_TARGETS[highIndex]
  return { kind: JdcChallengeTargetKind.Shanghai, value: value ?? 15 }
}

export const getJdcChallengeDartTarget = (
  visitIndex: number,
  dartIndex: number,
): JdcChallengeTarget => {
  const part = getJdcChallengePartForVisit(visitIndex)

  if (part !== JdcChallengePart.Doubles) {
    return getJdcChallengeTargetForVisit(visitIndex)
  }

  const absoluteDartIndex = (visitIndex - 6) * 3 + dartIndex

  if (absoluteDartIndex >= 20) {
    return { kind: JdcChallengeTargetKind.Bull }
  }

  const value = JDC_CHALLENGE_DOUBLE_TARGETS[absoluteDartIndex]
  return { kind: JdcChallengeTargetKind.Double, value: value ?? 1 }
}

export const getJdcChallengeTargetLabel = (target: JdcChallengeTarget): string => {
  switch (target.kind) {
    case JdcChallengeTargetKind.Shanghai:
      return String(target.value)
    case JdcChallengeTargetKind.Double:
      return `D${target.value}`
    case JdcChallengeTargetKind.Bull:
      return 'Bull'
    default: {
      const exhaustive: never = target
      throw new Error(`Unhandled target: ${String(exhaustive)}`)
    }
  }
}

export const getJdcChallengeVisitTargetLabel = (visitIndex: number): string => {
  const part = getJdcChallengePartForVisit(visitIndex)

  if (part !== JdcChallengePart.Doubles) {
    return getJdcChallengeTargetLabel(getJdcChallengeTargetForVisit(visitIndex))
  }

  const first = getJdcChallengeDartTarget(visitIndex, 0)
  const second = getJdcChallengeDartTarget(visitIndex, 1)
  const third = getJdcChallengeDartTarget(visitIndex, 2)

  return `${getJdcChallengeTargetLabel(first)} · ${getJdcChallengeTargetLabel(second)} · ${getJdcChallengeTargetLabel(third)}`
}

export const getJdcChallengeShanghaiOutcome = (
  dart: DartThrow,
  targetNumber: number,
): JdcChallengeShanghaiOutcome => {
  if (dart.multiplier === DartMultiplier.Miss || !hitsNumberSegment(dart, targetNumber)) {
    return JdcChallengeShanghaiOutcome.Miss
  }

  if (hitsSingleOnNumber(dart, targetNumber)) {
    return JdcChallengeShanghaiOutcome.Single
  }

  if (hitsDoubleOnNumber(dart, targetNumber)) {
    return JdcChallengeShanghaiOutcome.Double
  }

  if (hitsTripleOnNumber(dart, targetNumber)) {
    return JdcChallengeShanghaiOutcome.Triple
  }

  return JdcChallengeShanghaiOutcome.Miss
}

export const getJdcChallengeShanghaiDartPoints = (
  dart: DartThrow,
  targetNumber: number,
): number => {
  const outcome = getJdcChallengeShanghaiOutcome(dart, targetNumber)

  switch (outcome) {
    case JdcChallengeShanghaiOutcome.Miss:
      return 0
    case JdcChallengeShanghaiOutcome.Single:
      return targetNumber
    case JdcChallengeShanghaiOutcome.Double:
      return targetNumber * 2
    case JdcChallengeShanghaiOutcome.Triple:
      return targetNumber * 3
    default: {
      const exhaustive: never = outcome
      throw new Error(`Unhandled Shanghai outcome: ${String(exhaustive)}`)
    }
  }
}

export const isJdcChallengeShanghai = (darts: DartThrow[], targetNumber: number): boolean => {
  const outcomes = new Set(darts.map((dart) => getJdcChallengeShanghaiOutcome(dart, targetNumber)))

  return (
    outcomes.has(JdcChallengeShanghaiOutcome.Single) &&
    outcomes.has(JdcChallengeShanghaiOutcome.Double) &&
    outcomes.has(JdcChallengeShanghaiOutcome.Triple)
  )
}

export const getJdcChallengeDoubleOutcome = (
  dart: DartThrow,
  target: JdcChallengeTarget,
): JdcChallengeDoubleOutcome => {
  if (target.kind === JdcChallengeTargetKind.Bull) {
    return hitsBull(dart) ? JdcChallengeDoubleOutcome.Hit : JdcChallengeDoubleOutcome.Miss
  }

  if (target.kind !== JdcChallengeTargetKind.Double) {
    return JdcChallengeDoubleOutcome.Miss
  }

  return hitsDoubleOnNumber(dart, target.value)
    ? JdcChallengeDoubleOutcome.Hit
    : JdcChallengeDoubleOutcome.Miss
}

export const getJdcChallengeDoubleDartPoints = (
  dart: DartThrow,
  target: JdcChallengeTarget,
): number => {
  if (getJdcChallengeDoubleOutcome(dart, target) === JdcChallengeDoubleOutcome.Miss) {
    return 0
  }

  return target.kind === JdcChallengeTargetKind.Bull
    ? JDC_CHALLENGE_BULL_POINTS
    : JDC_CHALLENGE_DOUBLE_POINTS
}

export const getJdcChallengeDartPoints = (
  dart: DartThrow,
  visitIndex: number,
  dartIndex: number,
): number => {
  const target = getJdcChallengeDartTarget(visitIndex, dartIndex)

  if (target.kind === JdcChallengeTargetKind.Shanghai) {
    return getJdcChallengeShanghaiDartPoints(dart, target.value)
  }

  return getJdcChallengeDoubleDartPoints(dart, target)
}

export interface JdcChallengeVisitOutcome {
  visitScore: number
  scoreAfter: number
  shanghaiLowScoreAfter: number
  doublesScoreAfter: number
  shanghaiHighScoreAfter: number
  visitsCompletedAfter: number
  shanghaisHitAfter: number
  doublesHitAfter: number
  shanghaiBonus: number
  isShanghai: boolean
  dartPoints: number[]
  part: JdcChallengePart
  targetLabel: string
  checkout: boolean
}

export const resolveJdcChallengeVisit = (
  scoreBefore: number,
  shanghaiLowScore: number,
  doublesScore: number,
  shanghaiHighScore: number,
  visitsCompleted: number,
  shanghaisHit: number,
  doublesHit: number,
  darts: DartThrow[],
): JdcChallengeVisitOutcome => {
  const visitIndex = getJdcChallengeVisitIndex(visitsCompleted)
  const part = getJdcChallengePartForVisit(visitIndex)
  const dartPoints = darts.map((dart, dartIndex) =>
    getJdcChallengeDartPoints(dart, visitIndex, dartIndex),
  )
  const ringPoints = dartPoints.reduce((total, points) => total + points, 0)

  let shanghaiBonus = 0
  let isShanghai = false
  let doublesHitThisVisit = 0

  if (part === JdcChallengePart.ShanghaiLow || part === JdcChallengePart.ShanghaiHigh) {
    const target = getJdcChallengeTargetForVisit(visitIndex)
    if (target.kind === JdcChallengeTargetKind.Shanghai) {
      isShanghai = isJdcChallengeShanghai(darts, target.value)
      shanghaiBonus = isShanghai ? JDC_CHALLENGE_SHANGHAI_BONUS : 0
    }
  } else {
    doublesHitThisVisit = darts.reduce((count, dart, dartIndex) => {
      const target = getJdcChallengeDartTarget(visitIndex, dartIndex)
      return (
        count +
        (getJdcChallengeDoubleOutcome(dart, target) === JdcChallengeDoubleOutcome.Hit ? 1 : 0)
      )
    }, 0)
  }

  const visitScore = ringPoints + shanghaiBonus
  const scoreAfter = scoreBefore + visitScore
  const visitsCompletedAfter = visitsCompleted + 1

  return {
    visitScore,
    scoreAfter,
    shanghaiLowScoreAfter:
      part === JdcChallengePart.ShanghaiLow ? shanghaiLowScore + visitScore : shanghaiLowScore,
    doublesScoreAfter: part === JdcChallengePart.Doubles ? doublesScore + visitScore : doublesScore,
    shanghaiHighScoreAfter:
      part === JdcChallengePart.ShanghaiHigh ? shanghaiHighScore + visitScore : shanghaiHighScore,
    visitsCompletedAfter,
    shanghaisHitAfter: shanghaisHit + (isShanghai ? 1 : 0),
    doublesHitAfter: doublesHit + doublesHitThisVisit,
    shanghaiBonus,
    isShanghai,
    dartPoints,
    part,
    targetLabel: getJdcChallengeVisitTargetLabel(visitIndex),
    checkout: visitsCompletedAfter >= JDC_CHALLENGE_VISIT_COUNT,
  }
}

export const getJdcChallengeShanghaiPickerOutcomes = (): JdcChallengeShanghaiOutcome[] => [
  JdcChallengeShanghaiOutcome.Miss,
  JdcChallengeShanghaiOutcome.Single,
  JdcChallengeShanghaiOutcome.Triple,
  JdcChallengeShanghaiOutcome.Double,
]

export const getJdcChallengeDoublePickerOutcomes = (): JdcChallengeDoubleOutcome[] => [
  JdcChallengeDoubleOutcome.Miss,
  JdcChallengeDoubleOutcome.Hit,
]
