import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import { BigNumbersRequiredHits } from '@open-dart/game/types/bigNumbers'
import { PlayerKind } from '@open-dart/game/types/player'
import type { GameSession } from '@open-dart/game/types/gameSession'
import type { Visit } from '@open-dart/game/types/visit'
import { DartMultiplier } from '@open-dart/game/types/dart'
import { numberDart } from '@open-dart/game/testHelpers'
import {
  computeBigNumbersSingleSessionStats,
  getBigNumbersAvgHitsPerVisit,
  getBigNumbersBestSessionHitRate,
  getBigNumbersHitRate,
  getBigNumbersLiveStats,
  getBigNumbersVisitHitCount,
  isBigNumbersStepBackVisit,
} from './bigNumbersVisitStats'
import { computeBigNumbersSummary } from './practiceStats'

const visit = ({
  hitCount,
  scoreBefore,
  scoreAfter,
  advanced,
  checkout = false,
  dartCount = 3,
}: {
  hitCount: number
  scoreBefore: number
  scoreAfter: number
  advanced: boolean
  checkout?: boolean
  dartCount?: number
}): Visit => ({
  visitIndex: 0,
  playerId: 'p1',
  darts: Array.from({ length: dartCount }, () => numberDart(scoreBefore, DartMultiplier.Single)),
  visitScore: hitCount,
  scoreBefore,
  scoreAfter,
  bust: false,
  checkout,
  metadata: {
    hitCount,
    targetLabel: String(scoreBefore),
    advanced,
  },
})

const session = (visits: Visit[], finishedEarly = false): GameSession => ({
  id: 's1',
  mode: GameModeId.BigNumbers,
  config: { requiredHits: BigNumbersRequiredHits.Two },
  status: GameStatus.Completed,
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: '2026-01-01T00:10:00.000Z',
  players: [{ id: 'p1', name: 'Player', kind: PlayerKind.Human }],
  visits,
  finishedEarly,
})

describe('bigNumbersVisitStats', () => {
  it('reads hit counts from visit metadata', () => {
    expect(
      getBigNumbersVisitHitCount(
        visit({ hitCount: 2, scoreBefore: 2, scoreAfter: 3, advanced: true }),
      ),
    ).toBe(2)
    expect(
      getBigNumbersAvgHitsPerVisit([
        visit({ hitCount: 2, scoreBefore: 1, scoreAfter: 2, advanced: true }),
        visit({ hitCount: 0, scoreBefore: 2, scoreAfter: 1, advanced: false }),
        visit({ hitCount: 3, scoreBefore: 1, scoreAfter: 2, advanced: true }),
      ]),
    ).toBe(5 / 3)
  })

  it('counts step-backs only when leaving a number above 1', () => {
    expect(
      isBigNumbersStepBackVisit(
        visit({ hitCount: 0, scoreBefore: 1, scoreAfter: 1, advanced: false }),
      ),
    ).toBe(false)
    expect(
      isBigNumbersStepBackVisit(
        visit({ hitCount: 1, scoreBefore: 3, scoreAfter: 2, advanced: false }),
      ),
    ).toBe(true)
    expect(
      isBigNumbersStepBackVisit(
        visit({ hitCount: 2, scoreBefore: 3, scoreAfter: 4, advanced: true }),
      ),
    ).toBe(false)
  })

  it('summarizes live visits, step-backs, and hits per visit', () => {
    expect(getBigNumbersLiveStats([], 'p1')).toEqual({
      visitCount: 0,
      stepBackCount: 0,
      avgHitsPerVisit: null,
    })

    expect(
      getBigNumbersLiveStats(
        [
          visit({ hitCount: 0, scoreBefore: 1, scoreAfter: 1, advanced: false }),
          visit({ hitCount: 2, scoreBefore: 1, scoreAfter: 2, advanced: true }),
          visit({ hitCount: 0, scoreBefore: 2, scoreAfter: 1, advanced: false }),
        ],
        'p1',
      ),
    ).toEqual({ visitCount: 3, stepBackCount: 1, avgHitsPerVisit: 2 / 3 })
  })

  it('summarizes a single session', () => {
    const completed = computeBigNumbersSingleSessionStats(
      session([
        visit({ hitCount: 2, scoreBefore: 1, scoreAfter: 2, advanced: true }),
        visit({ hitCount: 2, scoreBefore: 20, scoreAfter: 21, advanced: true, checkout: true }),
      ]),
    )

    expect(completed).toEqual({
      visitCount: 2,
      avgHitsPerVisit: 2,
      hitRate: (4 / 6) * 100,
      completed: true,
    })

    const early = computeBigNumbersSingleSessionStats(
      session([visit({ hitCount: 1, scoreBefore: 1, scoreAfter: 1, advanced: false })], true),
    )

    expect(early).toMatchObject({
      visitCount: 1,
      avgHitsPerVisit: 1,
      hitRate: (1 / 3) * 100,
      completed: false,
    })
  })

  it('computes hit rate as hits over actual darts thrown', () => {
    const visits = [
      visit({ hitCount: 2, scoreBefore: 1, scoreAfter: 2, advanced: true, dartCount: 3 }),
      visit({ hitCount: 1, scoreBefore: 2, scoreAfter: 2, advanced: false, dartCount: 2 }),
    ]

    expect(getBigNumbersHitRate(visits)).toBe((3 / 5) * 100)
  })

  it('picks the best session hit rate', () => {
    const weaker = session([
      visit({ hitCount: 1, scoreBefore: 1, scoreAfter: 1, advanced: false, dartCount: 3 }),
    ])
    const stronger = session(
      [visit({ hitCount: 3, scoreBefore: 1, scoreAfter: 2, advanced: true, dartCount: 3 })],
      false,
    )
    stronger.id = 's2'

    expect(getBigNumbersBestSessionHitRate([weaker, stronger])).toBe(100)
  })
})

describe('computeBigNumbersSummary', () => {
  it('pools every required-hits variant into one hit rate', () => {
    const twoHits = {
      ...session([visit({ hitCount: 3, scoreBefore: 1, scoreAfter: 2, advanced: true })]),
      id: 'two',
    }
    const oneHit = {
      ...session([visit({ hitCount: 0, scoreBefore: 1, scoreAfter: 1, advanced: false })]),
      id: 'one',
      config: { requiredHits: BigNumbersRequiredHits.One },
    }

    const summary = computeBigNumbersSummary([twoHits, oneHit])

    expect(summary.gameCount).toBe(2)
    expect(summary.hitRate).toBe(50)
    expect(summary.bestHitRate).toBe(100)
  })

  it('returns empty values without games', () => {
    expect(computeBigNumbersSummary([])).toEqual({
      gameCount: 0,
      hitRate: null,
      bestHitRate: null,
    })
  })
})
