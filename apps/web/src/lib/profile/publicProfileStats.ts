import type { PlayerProfileStats, ProfileX01GroupStats } from '@open-dart/analytics'
import { X01StatsFilterId } from '@open-dart/analytics/x01Stats'
import { NINETY_NINE_DARTS_GROUPS, emptyNinetyNineDartsGroup } from './profileCards'
import type {
  BigNumbersSummaryInput,
  Bob27SummaryInput,
  JdcChallengeSummaryInput,
  NinetyNineDartsGroupInput,
  X01DetailInput,
  X01SummaryInput,
} from './profileCards'

export interface PublicX01GroupModel {
  summary: X01SummaryInput
  detail: X01DetailInput
}

export interface PublicProfileX01Model {
  fiveOhOneOnline: PublicX01GroupModel
  fiveOhOne: PublicX01GroupModel
}

export interface PublicProfileStatsModel {
  x01: PublicProfileX01Model
  jdcChallenge: JdcChallengeSummaryInput
  ninetyNineDarts: NinetyNineDartsGroupInput[]
  bigNumbers: BigNumbersSummaryInput
  bob27: Bob27SummaryInput
}

const emptyX01Group = (): PublicX01GroupModel => ({
  summary: {
    legCount: 0,
    threeDartAverage: null,
    avgDarts: null,
    bestDarts: null,
    threeDartAverageUntil170: null,
    checkoutPercent: null,
    bestLegAverage: null,
  },
  detail: {
    legWinRate: null,
    dartsThrown: 0,
    highestVisit: null,
    thrown180: 0,
    thrown140Plus: 0,
    thrown100Plus: 0,
    threeDartAverageUntilDouble: null,
    checkouts100Plus: 0,
    highestCheckout: null,
  },
})

const mapX01Group = (group: ProfileX01GroupStats | null | undefined): PublicX01GroupModel => {
  if (group === null || group === undefined) {
    return emptyX01Group()
  }

  return {
    summary: {
      legCount: group.legsPlayed,
      threeDartAverage: group.threeDartAverage,
      avgDarts: group.avgDarts,
      bestDarts: group.bestDarts,
      threeDartAverageUntil170: group.threeDartAverageUntil170,
      checkoutPercent: group.checkoutPercent,
      bestLegAverage: group.bestLegAverage,
    },
    detail: {
      legWinRate: group.legWinRate,
      dartsThrown: group.dartsThrown,
      highestVisit: group.highestVisit,
      thrown180: group.thrown180,
      thrown140Plus: group.thrown140Plus,
      thrown100Plus: group.thrown100Plus,
      threeDartAverageUntilDouble: group.threeDartAverageUntilDouble,
      checkouts100Plus: group.checkouts100Plus,
      highestCheckout: group.highestCheckout,
    },
  }
}

const emptyX01 = (): PublicProfileX01Model => ({
  fiveOhOneOnline: emptyX01Group(),
  fiveOhOne: emptyX01Group(),
})

export const getPublicX01Group = (
  x01: PublicProfileX01Model,
  id: X01StatsFilterId,
): PublicX01GroupModel =>
  id === X01StatsFilterId.FiveOhOneOnline ? x01.fiveOhOneOnline : x01.fiveOhOne

/** Missing sections become empty inputs so every core card still renders. */
export const buildPublicProfileStatsModel = (
  stats: PlayerProfileStats | null,
): PublicProfileStatsModel => {
  const x01 = stats?.x01
  const jdc = stats?.jdcChallenge ?? null
  const ninetyNine = stats?.ninetyNineDarts ?? null
  const bigNumbers = stats?.bigNumbers ?? null
  const bob27 = stats?.bob27 ?? null

  return {
    x01:
      x01 === undefined
        ? emptyX01()
        : {
            fiveOhOneOnline: mapX01Group(x01.fiveOhOneOnline),
            fiveOhOne: mapX01Group(x01.fiveOhOne),
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
      avgHitsPerVisit: bigNumbers?.avgHitsPerVisit ?? null,
      bestAvgHitsPerVisit: bigNumbers?.bestAvgHitsPerVisit ?? null,
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
