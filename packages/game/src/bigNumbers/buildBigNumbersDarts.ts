import { DartMultiplier, DartSegmentType } from '../types/dart'
import type { DartThrow } from '../types/dart'
import { createDartThrow } from '../dartScoring'
import { BIG_NUMBERS_MAX_DARTS_PER_VISIT, getBigNumbersTargetNumber } from './bigNumbersRules'

export type BigNumbersHitCount = 0 | 1 | 2 | 3

const createMissDart = (): DartThrow =>
  createDartThrow({ type: DartSegmentType.Number, value: 20 }, DartMultiplier.Miss)

export const createBigNumbersHitDart = (targetIndex: number): DartThrow =>
  createDartThrow(
    { type: DartSegmentType.Number, value: getBigNumbersTargetNumber(targetIndex) },
    DartMultiplier.Single,
  )

export const buildBigNumbersDartsForHitCount = (
  hitCount: BigNumbersHitCount,
  targetIndex: number,
): DartThrow[] => {
  const hits = Array.from({ length: hitCount }, () => createBigNumbersHitDart(targetIndex))
  const misses = Array.from({ length: BIG_NUMBERS_MAX_DARTS_PER_VISIT - hitCount }, () =>
    createMissDart(),
  )

  return [...hits, ...misses]
}
