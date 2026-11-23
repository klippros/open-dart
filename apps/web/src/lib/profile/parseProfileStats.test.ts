import { describe, expect, it } from 'vitest'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import { JdcChallengeGrade } from '@open-dart/game/types/jdcChallenge'
import { parsePlayerProfileStats } from './parseProfileStats'

describe('parsePlayerProfileStats', () => {
  it('accepts version 2 payloads and rejects version 1', () => {
    const payload = {
      version: 2,
      displayName: 'Alex',
      window: {
        startAt: '2026-07-26T12:00:00.000Z',
        endAt: '2026-08-25T12:00:00.000Z',
      },
      fiveOhOne: {
        legsPlayed: 2,
        threeDartAverage: 60,
        threeDartAverageUntil170: 62,
        checkoutPercent: 40,
        avgDarts: 18,
        bestLegAverage: 100,
        bestLegDarts: 15,
        legWinRate: 50,
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
    expect(parsed?.version).toBe(2)
    expect(parsed?.fiveOhOne?.bestLegAverage).toBe(100)
    expect(parsed?.ninetyNineDarts?.groups[0]?.sessionsPlayed).toBe(1)
    expect(parsed?.ninetyNineDarts?.groups[0]?.bestFinalScore).toBe(120)
    expect(parsed?.jdcChallenge?.badge).toEqual({
      score: 90,
      grade: JdcChallengeGrade.Blue,
    })
    expect(parsed).not.toHaveProperty('aroundTheClock')

    expect(parsePlayerProfileStats({ ...payload, version: 1 })).toBeNull()
  })
})
