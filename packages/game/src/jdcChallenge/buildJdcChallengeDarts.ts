import { DartMultiplier, DartSegmentType } from '../types/dart.ts'
import type { DartThrow } from '../types/dart.ts'
import { createDartThrow } from '../dartScoring.ts'
import {
  JdcChallengeDoubleOutcome,
  JdcChallengeShanghaiOutcome,
  JdcChallengeTargetKind,
} from '../types/jdcChallenge.ts'
import type { JdcChallengeTarget } from '../types/jdcChallenge.ts'

const createMissDart = (): DartThrow =>
  createDartThrow({ type: DartSegmentType.Number, value: 20 }, DartMultiplier.Miss)

export const buildJdcChallengeShanghaiThrow = (
  outcome: JdcChallengeShanghaiOutcome,
  targetNumber: number,
): DartThrow => {
  if (outcome === JdcChallengeShanghaiOutcome.Miss) {
    return createMissDart()
  }

  const multiplier =
    outcome === JdcChallengeShanghaiOutcome.Single
      ? DartMultiplier.Single
      : outcome === JdcChallengeShanghaiOutcome.Double
        ? DartMultiplier.Double
        : DartMultiplier.Triple

  return createDartThrow({ type: DartSegmentType.Number, value: targetNumber }, multiplier)
}

export const buildJdcChallengeDoubleThrow = (
  outcome: JdcChallengeDoubleOutcome,
  target: JdcChallengeTarget,
): DartThrow => {
  if (outcome === JdcChallengeDoubleOutcome.Miss) {
    return createMissDart()
  }

  if (target.kind === JdcChallengeTargetKind.Bull) {
    return createDartThrow({ type: DartSegmentType.Bull }, DartMultiplier.Single)
  }

  if (target.kind !== JdcChallengeTargetKind.Double) {
    throw new Error('Double throw requires a double or bull target')
  }

  return createDartThrow(
    { type: DartSegmentType.Number, value: target.value },
    DartMultiplier.Double,
  )
}
