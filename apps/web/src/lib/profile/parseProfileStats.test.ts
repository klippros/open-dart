import { describe, expect, it } from 'vitest'
import { PROFILE_STATS_VERSION } from '@open-dart/analytics'
import type { ProfileX01GroupStats } from '@open-dart/analytics'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import { JdcChallengeGrade } from '@open-dart/game/types/jdcChallenge'
import { parsePlayerProfileStats } from './parseProfileStats'

const x01Group = (legsPlayed: number): ProfileX01GroupStats => ({
  legsPlayed,
  threeDartAverage: legsPlayed === 0 ? null : 60,
  threeDartAverageUntil170: legsPlayed === 0 ? null : 62,
  threeDartAverageUntilDouble: legsPlayed === 0 ? null : 58,
  checkoutPercent: legsPlayed === 0 ? null : 40,
  avgDarts: legsPlayed === 0 ? null : 18,
  bestDarts: legsPlayed === 0 ? null : 12,
  bestLegAverage: legsPlayed === 0 ? null : 100,
  dartsThrown: legsPlayed * 18,
  legWinRate: legsPlayed === 0 ? null : 50,
  thrown180: legsPlayed,
  thrown140Plus: legsPlayed,
  thrown100Plus: legsPlayed,
  checkouts100Plus: 0,
  highestVisit: legsPlayed === 0 ? null : 180,
  highestCheckout: legsPlayed === 0 ? null : 40,
})

describe('parsePlayerProfileStats', () => {
  it('accepts version 3 x01 groups and rejects older payloads', () => {
    const payload = {
      version: PROFILE_STATS_VERSION,
      displayName: 'Alex',
      window: {
        startAt: '2026-07-26T12:00:00.000Z',
        endAt: '2026-08-25T12:00:00.000Z',
      },
      x01: {
        fiveOhOneOnline: x01Group(1),
        fiveOhOne: x01Group(2),
        oneSeventy: x01Group(0),
        all: x01Group(3),
      },
      bob27: null,
      ninetyNineDarts: {
        groups: [
          {
            group: NinetyNineDartsStatGroup.Twenty,
            sessionsPlayed: 1,
            avgFinalScore: 90,
            bestFinalScore: 120,
            hitRate: 50,
            avgTreblesPerGame: 10,
            avgSinglesPerGame: 5,
            avgDoublesPerGame: 2,
          },
        ],
      },
      bigNumbers: {
        sessionsPlayed: 3,
        hitRate: 40,
        bestHitRate: 70,
      },
      jdcChallenge: {
        sessionsPlayed: 1,
        avgFinalScore: 80,
        bestFinalScore: 90,
        avgShanghaisPerGame: 1,
        avgShanghaiLowScore: 20,
        avgDoublesScore: 30,
        avgShanghaiHighScore: 30,
        badge: {
          score: 90,
          grade: JdcChallengeGrade.Blue,
        },
      },
    }

    const parsed = parsePlayerProfileStats(payload)
    expect(parsed?.version).toBe(PROFILE_STATS_VERSION)
    expect(parsed?.x01.fiveOhOne.bestLegAverage).toBe(100)
    expect(parsed?.x01.fiveOhOne.bestDarts).toBe(12)
    expect(parsed?.x01.all.legsPlayed).toBe(3)
    expect(parsed?.x01.fiveOhOne).not.toHaveProperty('bestLegSource')
    expect(parsed?.ninetyNineDarts?.groups[0]?.sessionsPlayed).toBe(1)
    expect(parsed?.ninetyNineDarts?.groups[0]?.bestFinalScore).toBe(120)
    expect(parsed?.jdcChallenge?.badge).toEqual({
      score: 90,
      grade: JdcChallengeGrade.Blue,
    })
    expect(parsed).not.toHaveProperty('aroundTheClock')

    expect(parsePlayerProfileStats({ ...payload, version: 2 })).toBeNull()
    expect(parsePlayerProfileStats({ ...payload, version: 1 })).toBeNull()
    expect(
      parsePlayerProfileStats({
        ...payload,
        x01: {
          ...payload.x01,
          fiveOhOne: { ...payload.x01.fiveOhOne, bestLegSource: { sessionId: 's', legNumber: 1 } },
        },
      }),
    ).toBeNull()
    expect(
      parsePlayerProfileStats({
        ...payload,
        x01: {
          ...payload.x01,
          all: { ...payload.x01.all, visits: [] },
        },
      }),
    ).toBeNull()
  })
})
