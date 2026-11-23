import type { PlayerProfileStats } from '@open-dart/analytics'
import { NINETY_NINE_DARTS_GROUPS, emptyNinetyNineDartsGroup } from './profileCards'
import type {
  BigNumbersSummaryInput,
  Bob27SummaryInput,
  JdcChallengeSummaryInput,
  NinetyNineDartsGroupInput,
  X01SummaryInput,
} from './profileCards'

export interface PublicProfileStatsModel {
  x01: X01SummaryInput
  jdcChallenge: JdcChallengeSummaryInput
  ninetyNineDarts: NinetyNineDartsGroupInput[]
  bigNumbers: BigNumbersSummaryInput
  bob27: Bob27SummaryInput
}

/** Missing sections become empty inputs so every core card still renders. */
export const buildPublicProfileStatsModel = (
  stats: PlayerProfileStats | null,
): PublicProfileStatsModel => {
  const fiveOhOne = stats?.fiveOhOne ?? null
  const jdc = stats?.jdcChallenge ?? null
  const ninetyNine = stats?.ninetyNineDarts ?? null
  const bigNumbers = stats?.bigNumbers ?? null
  const bob27 = stats?.bob27 ?? null

  return {
    x01: {
      legCount: fiveOhOne?.legsPlayed ?? 0,
      threeDartAverage: fiveOhOne?.threeDartAverage ?? null,
      avgDarts: fiveOhOne?.avgDarts ?? null,
      threeDartAverageUntil170: fiveOhOne?.threeDartAverageUntil170 ?? null,
      checkoutPercent: fiveOhOne?.checkoutPercent ?? null,
      bestLegAverage: fiveOhOne?.bestLegAverage ?? null,
      bestLegDarts: fiveOhOne?.bestLegDarts ?? null,
    },
    jdcChallenge: {
      sessionCount: jdc?.sessionsPlayed ?? 0,
      avgScore: jdc?.avgFinalScore ?? null,
      avgShanghais: jdc?.avgShanghaisPerGame ?? null,
      bestScore: jdc?.bestFinalScore ?? null,
      avgShanghaiLowScore: jdc?.avgShanghaiLowScore ?? null,
      avgDoublesScore: jdc?.avgDoublesScore ?? null,
      avgShanghaiHighScore: jdc?.avgShanghaiHighScore ?? null,
    },
    ninetyNineDarts: NINETY_NINE_DARTS_GROUPS.map((group) => {
      const groupStats = ninetyNine?.groups.find((candidate) => candidate.group === group)
      if (groupStats === undefined) {
        return emptyNinetyNineDartsGroup(group)
      }
      return {
        group,
        sessionCount: groupStats.sessionsPlayed,
        avgScore: groupStats.avgFinalScore,
        bestScore: groupStats.bestFinalScore,
        hitRate: groupStats.hitRate,
        avgSingles: groupStats.avgSinglesPerGame,
        avgDoubles: groupStats.avgDoublesPerGame,
        avgTrebles: groupStats.avgTreblesPerGame,
      }
    }),
    bigNumbers: {
      sessionCount: bigNumbers?.sessionsPlayed ?? 0,
      hitRate: bigNumbers?.hitRate ?? null,
      bestHitRate: bigNumbers?.bestHitRate ?? null,
    },
    bob27: {
      sessionCount: bob27?.sessionsPlayed ?? 0,
      avgScore: bob27?.avgFinalScore ?? null,
      hitRate: bob27?.hitRate ?? null,
      avgHitsPerVisit: bob27?.avgHitsPerVisit ?? null,
      avgDoublesPerGame: bob27?.avgDoublesPerGame ?? null,
      bestScore: bob27?.bestFinalScore ?? null,
      bestHitsPerVisit: bob27?.bestHitsPerVisit ?? null,
      bestDoublesPerGame: bob27?.bestDoublesPerGame ?? null,
    },
  }
}
