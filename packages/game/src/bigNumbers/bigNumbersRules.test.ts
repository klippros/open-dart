import { describe, expect, it } from 'vitest'
import { DartMultiplier } from '../types/dart'
import { BigNumbersRequiredHits } from '../types/bigNumbers'
import { bullDart, numberDart } from '../testHelpers'
import {
  countBigNumbersTargetHits,
  getBigNumbersTargetLabel,
  isBigNumbersTargetHit,
  resolveBigNumbersVisit,
} from './bigNumbersRules'

describe('bigNumbersRules', () => {
  it('labels targets from 1 to 20', () => {
    expect(getBigNumbersTargetLabel(0)).toBe('1')
    expect(getBigNumbersTargetLabel(19)).toBe('20')
    expect(getBigNumbersTargetLabel(20)).toBe('Done')
  })

  it('counts only singles on the current number as a hit', () => {
    expect(isBigNumbersTargetHit(numberDart(5, DartMultiplier.Single), 4)).toBe(true)
    expect(isBigNumbersTargetHit(numberDart(5, DartMultiplier.Double), 4)).toBe(false)
    expect(isBigNumbersTargetHit(numberDart(5, DartMultiplier.Triple), 4)).toBe(false)
    expect(isBigNumbersTargetHit(numberDart(6, DartMultiplier.Single), 4)).toBe(false)
    expect(isBigNumbersTargetHit(bullDart(), 4)).toBe(false)
  })

  it('advances when singles meet the requirement and ignores doubles and trebles', () => {
    const outcome = resolveBigNumbersVisit(
      0,
      [
        numberDart(1, DartMultiplier.Single),
        numberDart(1, DartMultiplier.Double),
        numberDart(1, DartMultiplier.Triple),
      ],
      BigNumbersRequiredHits.Two,
    )

    expect(outcome).toMatchObject({
      targetIndexAfter: 0,
      hitCount: 1,
      advanced: false,
      checkout: false,
    })

    const withSingles = resolveBigNumbersVisit(
      0,
      [
        numberDart(1, DartMultiplier.Single),
        numberDart(1, DartMultiplier.Single),
        numberDart(20, DartMultiplier.Miss),
      ],
      BigNumbersRequiredHits.Two,
    )

    expect(withSingles).toMatchObject({
      targetIndexAfter: 1,
      hitCount: 2,
      advanced: true,
      checkout: false,
    })
  })

  it('goes back one when hits fall short, and stays on 1', () => {
    const fromTwo = resolveBigNumbersVisit(
      1,
      [numberDart(2, DartMultiplier.Single), numberDart(20, DartMultiplier.Miss)],
      BigNumbersRequiredHits.Two,
    )
    expect(fromTwo).toMatchObject({
      targetIndexAfter: 0,
      hitCount: 1,
      advanced: false,
      checkout: false,
    })

    const fromOne = resolveBigNumbersVisit(
      0,
      [
        numberDart(20, DartMultiplier.Miss),
        numberDart(20, DartMultiplier.Miss),
        numberDart(20, DartMultiplier.Miss),
      ],
      BigNumbersRequiredHits.One,
    )
    expect(fromOne).toMatchObject({
      targetIndexAfter: 0,
      hitCount: 0,
      advanced: false,
      checkout: false,
    })
  })

  it('finishes when advancing from 20', () => {
    const outcome = resolveBigNumbersVisit(
      19,
      [numberDart(20, DartMultiplier.Single)],
      BigNumbersRequiredHits.One,
    )

    expect(outcome).toMatchObject({
      targetIndexAfter: 20,
      hitCount: 1,
      advanced: true,
      checkout: true,
    })
  })

  it('advances and finishes with 0 required hits even on misses', () => {
    const advance = resolveBigNumbersVisit(
      0,
      [
        numberDart(20, DartMultiplier.Miss),
        numberDart(20, DartMultiplier.Miss),
        numberDart(20, DartMultiplier.Miss),
      ],
      BigNumbersRequiredHits.Zero,
    )

    expect(advance).toMatchObject({
      targetIndexAfter: 1,
      hitCount: 0,
      advanced: true,
      checkout: false,
    })

    const finish = resolveBigNumbersVisit(
      19,
      [
        numberDart(1, DartMultiplier.Miss),
        numberDart(1, DartMultiplier.Miss),
        numberDart(1, DartMultiplier.Miss),
      ],
      BigNumbersRequiredHits.Zero,
    )

    expect(finish).toMatchObject({
      targetIndexAfter: 20,
      hitCount: 0,
      advanced: true,
      checkout: true,
    })
  })

  it('counts single hits for the visit', () => {
    expect(
      countBigNumbersTargetHits(
        [
          numberDart(3, DartMultiplier.Single),
          numberDart(4, DartMultiplier.Single),
          numberDart(3, DartMultiplier.Triple),
        ],
        2,
      ),
    ).toBe(1)
  })
})
