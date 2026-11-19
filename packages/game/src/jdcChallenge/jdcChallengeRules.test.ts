import { describe, expect, it } from 'vitest'
import { DartMultiplier } from '../types/dart'
import {
  JdcChallengeDoubleOutcome,
  JdcChallengeGrade,
  JdcChallengePart,
  JdcChallengeShanghaiOutcome,
  JdcChallengeTargetKind,
} from '../types/jdcChallenge'
import { numberDart, bullDart, outerBullDart } from '../testHelpers'
import {
  buildJdcChallengeDoubleThrow,
  buildJdcChallengeShanghaiThrow,
} from './buildJdcChallengeDarts'
import {
  getJdcChallengeDartTarget,
  getJdcChallengeDoubleDartPoints,
  getJdcChallengeGrade,
  getJdcChallengeShanghaiDartPoints,
  getJdcChallengeTargetForVisit,
  getJdcChallengeVisitTargetLabel,
  isJdcChallengeShanghai,
  JDC_CHALLENGE_MAX_SCORE,
  JDC_CHALLENGE_VISIT_COUNT,
  resolveJdcChallengeVisit,
} from './jdcChallengeRules'

describe('jdcChallengeRules', () => {
  it('maps the 19 visits to Shanghai 10-15, doubles, then Shanghai 15-20', () => {
    expect(getJdcChallengeTargetForVisit(0)).toEqual({
      kind: JdcChallengeTargetKind.Shanghai,
      value: 10,
    })
    expect(getJdcChallengeTargetForVisit(5)).toEqual({
      kind: JdcChallengeTargetKind.Shanghai,
      value: 15,
    })
    expect(getJdcChallengeDartTarget(6, 0)).toEqual({
      kind: JdcChallengeTargetKind.Double,
      value: 1,
    })
    expect(getJdcChallengeDartTarget(6, 2)).toEqual({
      kind: JdcChallengeTargetKind.Double,
      value: 3,
    })
    expect(getJdcChallengeDartTarget(12, 2)).toEqual({ kind: JdcChallengeTargetKind.Bull })
    expect(getJdcChallengeTargetForVisit(13)).toEqual({
      kind: JdcChallengeTargetKind.Shanghai,
      value: 15,
    })
    expect(getJdcChallengeTargetForVisit(18)).toEqual({
      kind: JdcChallengeTargetKind.Shanghai,
      value: 20,
    })
    expect(JDC_CHALLENGE_VISIT_COUNT).toBe(19)
  })

  it('scores Shanghai face values and awards the bonus only for single+double+treble', () => {
    expect(getJdcChallengeShanghaiDartPoints(numberDart(12, DartMultiplier.Single), 12)).toBe(12)
    expect(getJdcChallengeShanghaiDartPoints(numberDart(12, DartMultiplier.Double), 12)).toBe(24)
    expect(getJdcChallengeShanghaiDartPoints(numberDart(12, DartMultiplier.Triple), 12)).toBe(36)
    expect(getJdcChallengeShanghaiDartPoints(numberDart(20, DartMultiplier.Triple), 12)).toBe(0)

    const shanghai = [
      numberDart(15, DartMultiplier.Single),
      numberDart(15, DartMultiplier.Double),
      numberDart(15, DartMultiplier.Triple),
    ]
    expect(isJdcChallengeShanghai(shanghai, 15)).toBe(true)

    const threeTrebles = [
      numberDart(15, DartMultiplier.Triple),
      numberDart(15, DartMultiplier.Triple),
      numberDart(15, DartMultiplier.Triple),
    ]
    expect(isJdcChallengeShanghai(threeTrebles, 15)).toBe(false)

    const resolved = resolveJdcChallengeVisit(0, 0, 0, 0, 5, 0, 0, shanghai)
    expect(resolved.visitScore).toBe(190)
    expect(resolved.shanghaiBonus).toBe(100)
    expect(resolved.isShanghai).toBe(true)
    expect(resolved.part).toBe(JdcChallengePart.ShanghaiLow)
    expect(resolved.shanghaisHitAfter).toBe(1)
  })

  it('scores doubles at 50 and bullseye at 100, ignoring outer bull', () => {
    const doubleTarget = { kind: JdcChallengeTargetKind.Double, value: 8 } as const
    const bullTarget = { kind: JdcChallengeTargetKind.Bull } as const

    expect(
      getJdcChallengeDoubleDartPoints(numberDart(8, DartMultiplier.Double), doubleTarget),
    ).toBe(50)
    expect(
      getJdcChallengeDoubleDartPoints(numberDart(8, DartMultiplier.Single), doubleTarget),
    ).toBe(0)
    expect(getJdcChallengeDoubleDartPoints(bullDart(), bullTarget)).toBe(100)
    expect(getJdcChallengeDoubleDartPoints(outerBullDart(DartMultiplier.Single), bullTarget)).toBe(
      0,
    )

    const visit = resolveJdcChallengeVisit(200, 200, 0, 0, 6, 1, 0, [
      buildJdcChallengeDoubleThrow(JdcChallengeDoubleOutcome.Hit, {
        kind: JdcChallengeTargetKind.Double,
        value: 1,
      }),
      buildJdcChallengeDoubleThrow(JdcChallengeDoubleOutcome.Miss, {
        kind: JdcChallengeTargetKind.Double,
        value: 2,
      }),
      buildJdcChallengeDoubleThrow(JdcChallengeDoubleOutcome.Hit, {
        kind: JdcChallengeTargetKind.Double,
        value: 3,
      }),
    ])

    expect(visit.visitScore).toBe(100)
    expect(visit.doublesScoreAfter).toBe(100)
    expect(visit.doublesHitAfter).toBe(2)
    expect(visit.targetLabel).toBe('D1 · D2 · D3')
  })

  it('labels grade bands from the published cutoffs', () => {
    expect(getJdcChallengeGrade(0)).toBe(JdcChallengeGrade.White)
    expect(getJdcChallengeGrade(149)).toBe(JdcChallengeGrade.White)
    expect(getJdcChallengeGrade(150)).toBe(JdcChallengeGrade.Purple)
    expect(getJdcChallengeGrade(300)).toBe(JdcChallengeGrade.Yellow)
    expect(getJdcChallengeGrade(450)).toBe(JdcChallengeGrade.Green)
    expect(getJdcChallengeGrade(600)).toBe(JdcChallengeGrade.Blue)
    expect(getJdcChallengeGrade(700)).toBe(JdcChallengeGrade.Red)
    expect(getJdcChallengeGrade(850)).toBe(JdcChallengeGrade.Black)
    expect(getJdcChallengeGrade(1249)).toBe(JdcChallengeGrade.Black)
    expect(getJdcChallengeGrade(1250)).toBe(JdcChallengeGrade.Gold)
    expect(JDC_CHALLENGE_MAX_SCORE).toBe(3380)
  })

  it('builds throws that match the picker outcomes', () => {
    const miss = buildJdcChallengeShanghaiThrow(JdcChallengeShanghaiOutcome.Miss, 10)
    expect(miss.multiplier).toBe(DartMultiplier.Miss)

    const treble = buildJdcChallengeShanghaiThrow(JdcChallengeShanghaiOutcome.Triple, 10)
    expect(treble).toMatchObject({
      multiplier: DartMultiplier.Triple,
      segment: { type: 'number', value: 10 },
    })

    const bull = buildJdcChallengeDoubleThrow(JdcChallengeDoubleOutcome.Hit, {
      kind: JdcChallengeTargetKind.Bull,
    })
    expect(bull.segment.type).toBe('bull')
    expect(bull.points).toBe(50)
  })

  it('labels mixed doubles visits', () => {
    expect(getJdcChallengeVisitTargetLabel(12)).toBe('D19 · D20 · Bull')
  })
})
