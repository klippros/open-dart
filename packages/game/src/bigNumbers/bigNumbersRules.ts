import type { DartThrow } from '../types/dart.ts'
import { BigNumbersRequiredHits } from '../types/bigNumbers.ts'
import { hitsSingleOnNumber } from '../segmentMatching.ts'

export const BIG_NUMBERS_TARGET_COUNT = 20
export const BIG_NUMBERS_MAX_DARTS_PER_VISIT = 3

export const requiredHitsToNumber = (requiredHits: BigNumbersRequiredHits): number => {
  switch (requiredHits) {
    case BigNumbersRequiredHits.Zero:
      return 0
    case BigNumbersRequiredHits.One:
      return 1
    case BigNumbersRequiredHits.Two:
      return 2
    case BigNumbersRequiredHits.Three:
      return 3
    default: {
      const exhaustive: never = requiredHits
      throw new Error(`Unhandled required hits: ${String(exhaustive)}`)
    }
  }
}

export const getBigNumbersTargetNumber = (targetIndex: number): number => targetIndex + 1

export const getBigNumbersTargetLabel = (targetIndex: number): string => {
  if (targetIndex >= BIG_NUMBERS_TARGET_COUNT) {
    return 'Done'
  }

  return String(getBigNumbersTargetNumber(targetIndex))
}

export const isBigNumbersTargetHit = (dart: DartThrow, targetIndex: number): boolean => {
  if (targetIndex < 0 || targetIndex >= BIG_NUMBERS_TARGET_COUNT) {
    return false
  }

  return hitsSingleOnNumber(dart, getBigNumbersTargetNumber(targetIndex))
}

export const countBigNumbersTargetHits = (darts: DartThrow[], targetIndex: number): number =>
  darts.filter((dart) => isBigNumbersTargetHit(dart, targetIndex)).length

export interface BigNumbersVisitOutcome {
  targetIndexAfter: number
  hitCount: number
  advanced: boolean
  checkout: boolean
}

export const resolveBigNumbersVisit = (
  targetIndex: number,
  darts: DartThrow[],
  requiredHits: BigNumbersRequiredHits,
): BigNumbersVisitOutcome => {
  const hitCount = countBigNumbersTargetHits(darts, targetIndex)
  const advanced = hitCount >= requiredHitsToNumber(requiredHits)

  if (advanced) {
    const targetIndexAfter = targetIndex + 1
    const checkout = targetIndexAfter >= BIG_NUMBERS_TARGET_COUNT

    return {
      targetIndexAfter,
      hitCount,
      advanced: true,
      checkout,
    }
  }

  return {
    targetIndexAfter: Math.max(0, targetIndex - 1),
    hitCount,
    advanced: false,
    checkout: false,
  }
}
