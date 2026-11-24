import { describe, expect, it } from 'vitest'
import { PROFILE_STATS_VERSION } from '@open-dart/analytics'
import type { PlayerProfileStats, ProfileX01GroupStats } from '@open-dart/analytics'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import {
  buildBob27SummaryCards,
  buildJdcChallengeSegmentCards,
  buildNinetyNineDartsHitCards,
  buildX01DetailRows,
  buildX01SummaryCards,
} from './profileCards'
import { buildPublicProfileStatsModel } from './publicProfileStats'

const x01Group = (legsPlayed: number): ProfileX01GroupStats => ({
  legsPlayed,
  threeDartAverage: legsPlayed === 0 ? null : 55,
  threeDartAverageUntil170: legsPlayed === 0 ? null : 58,
  threeDartAverageUntilDouble: legsPlayed === 0 ? null : 52,
  checkoutPercent: legsPlayed === 0 ? null : 30,
  avgDarts: legsPlayed === 0 ? null : 24,
  bestDarts: legsPlayed === 0 ? null : 18,
  bestLegAverage: legsPlayed === 0 ? null : 70,
  dartsThrown: legsPlayed * 24,
  legWinRate: legsPlayed === 0 ? null : 50,
  thrown180: legsPlayed,
  thrown140Plus: legsPlayed,
  thrown100Plus: legsPlayed * 2,
  checkouts100Plus: 1,
  highestVisit: legsPlayed === 0 ? null : 180,
  highestCheckout: legsPlayed === 0 ? null : 120,
})

const emptyX01 = {
  fiveOhOneOnline: x01Group(0),
  fiveOhOne: x01Group(0),
}

const emptyStats: PlayerProfileStats = {
  version: PROFILE_STATS_VERSION,
  displayName: 'Alex',
  window: { startAt: '2026-07-26T12:00:00.000Z', endAt: '2026-08-25T12:00:00.000Z' },
  x01: emptyX01,
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
      expect(model.x01.fiveOhOne.summary.legCount).toBe(0)
      expect(model.x01.fiveOhOneOnline.summary.legCount).toBe(0)
      expect(model.x01).not.toHaveProperty('all')
      expect(model.x01).not.toHaveProperty('oneSeventy')
      expect(model.x01.fiveOhOne.summary).not.toHaveProperty('bestLegSource')
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
      x01: {
        fiveOhOneOnline: x01Group(3),
        fiveOhOne: x01Group(5),
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

    expect(model.x01.fiveOhOne.summary.legCount).toBe(5)
    expect(model.x01.fiveOhOne.summary.avgDarts).toBe(24)
    expect(model.x01.fiveOhOne.summary.bestDarts).toBe(18)
    expect(model.x01.fiveOhOneOnline.summary.legCount).toBe(3)
    expect(model.x01).not.toHaveProperty('all')
    expect(model.x01).not.toHaveProperty('oneSeventy')
    expect(model.x01.fiveOhOne.summary).not.toHaveProperty('bestLegSource')
    expect(model.x01.fiveOhOne.summary).not.toHaveProperty('bestDartsSource')
    expect(
      buildX01SummaryCards(model.x01.fiveOhOne.summary, {
        scope: { type: 'x01-501' },
        scopeLabel: '501',
      })[0]?.details[0]?.source,
    ).toBeNull()
    expect(
      buildX01DetailRows(model.x01.fiveOhOne.detail, {
        scope: { type: 'x01-501' },
        scopeLabel: '501',
      }).map((row) => row.label),
    ).toContain('180s')

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
    expect(buildBob27SummaryCards(model.bob27)[0]?.details.map((detail) => detail.text)).toEqual([
      'Best 250',
    ])
    expect(buildBob27SummaryCards(model.bob27)[1]?.details.map((detail) => detail.text)).toEqual([
      '1.10 Visit / 7.0 Game',
    ])
  })
})
