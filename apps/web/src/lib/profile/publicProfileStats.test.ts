import { describe, expect, it } from 'vitest'
import { PROFILE_STATS_VERSION } from '@open-dart/analytics'
import type { PlayerProfileStats } from '@open-dart/analytics'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import {
  buildBob27SummaryCards,
  buildJdcChallengeSegmentCards,
  buildNinetyNineDartsHitCards,
} from './profileCards'
import { buildPublicProfileStatsModel } from './publicProfileStats'

const emptyStats: PlayerProfileStats = {
  version: PROFILE_STATS_VERSION,
  displayName: 'Alex',
  window: { startAt: '2026-07-26T12:00:00.000Z', endAt: '2026-08-25T12:00:00.000Z' },
  fiveOhOne: null,
  bob27: null,
  ninetyNineDarts: null,
  bigNumbers: null,
  jdcChallenge: null,
}

describe('buildPublicProfileStatsModel', () => {
  it('keeps every core section as an empty input without data', () => {
    for (const model of [
      buildPublicProfileStatsModel(null),
      buildPublicProfileStatsModel(emptyStats),
    ]) {
      expect(model.x01.legCount).toBe(0)
      expect(model.jdcChallenge.sessionCount).toBe(0)
      expect(model.bigNumbers.sessionCount).toBe(0)
      expect(model.bob27.sessionCount).toBe(0)
      expect(model.ninetyNineDarts.map((group) => group.group)).toEqual([
        NinetyNineDartsStatGroup.Twenty,
        NinetyNineDartsStatGroup.Bull,
        NinetyNineDartsStatGroup.Other,
      ])
    }
  })

  it('maps payload fields onto the shared card inputs', () => {
    const model = buildPublicProfileStatsModel({
      ...emptyStats,
      fiveOhOne: {
        legsPlayed: 8,
        threeDartAverage: 55,
        threeDartAverageUntil170: 58,
        checkoutPercent: 30,
        avgDarts: 24,
        bestLegAverage: 70,
        bestLegDarts: 21,
        legWinRate: 50,
      },
      ninetyNineDarts: {
        groups: [
          {
            group: NinetyNineDartsStatGroup.Bull,
            sessionsPlayed: 2,
            avgFinalScore: 40,
            bestFinalScore: 80,
            hitRate: 20,
            avgTreblesPerGame: null,
            avgSinglesPerGame: 5,
            avgDoublesPerGame: 2,
          },
        ],
      },
      jdcChallenge: {
        sessionsPlayed: 1,
        avgFinalScore: 800,
        bestFinalScore: 800,
        avgShanghaisPerGame: 1,
        avgShanghaiLowScore: 150,
        avgDoublesScore: 250,
        avgShanghaiHighScore: 400,
        badge: null,
      },
      bob27: {
        sessionsPlayed: 3,
        avgFinalScore: 100,
        hitRate: 35,
        bestFinalScore: 250,
        avgHitsPerVisit: 1.1,
        avgDoublesPerGame: 7,
        bestHitsPerVisit: 1.5,
        bestDoublesPerGame: 10,
      },
    })

    expect(model.x01.legCount).toBe(8)
    expect(model.x01.bestLegDarts).toBe(21)

    const bull = model.ninetyNineDarts.find(
      (group) => group.group === NinetyNineDartsStatGroup.Bull,
    )
    expect(bull?.sessionCount).toBe(2)
    expect(buildNinetyNineDartsHitCards(bull ?? model.ninetyNineDarts[0]!)[0]?.value).toBe('5.0')

    expect(buildJdcChallengeSegmentCards(model.jdcChallenge).map((card) => card.value)).toEqual([
      '150',
      '250',
      '400',
    ])
    expect(buildBob27SummaryCards(model.bob27)[2]?.details.map((detail) => detail.text)).toEqual([
      '1.50 best / visit',
      '10 best doubles / game',
    ])
  })
})
