import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { DartMultiplier } from '@open-dart/game/types/dart'
import { numberDart } from '@open-dart/game/testHelpers'
import { computeX01Stats, FIVE_OH_ONE_START_SCORE } from './x01Stats'

const sampleVisit = (
  overrides: Partial<GameSession['visits'][number]> = {},
): GameSession['visits'][number] => ({
  visitIndex: 0,
  playerId: 'player-1',
  darts: [numberDart(20, DartMultiplier.Triple)],
  visitScore: 60,
  scoreBefore: 501,
  scoreAfter: 441,
  bust: false,
  checkout: false,
  ...overrides,
})

const sampleSession = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  mode: GameModeId.X01,
  config: { startScore: FIVE_OH_ONE_START_SCORE, doubleIn: false, doubleOut: true },
  players: [{ id: 'player-1', name: 'You', kind: PlayerKind.Human }],
  visits: [sampleVisit()],
  status: GameStatus.Completed,
  startedAt: '2026-01-01T10:00:00.000Z',
  completedAt: '2026-01-01T10:00:00.000Z',
  ...overrides,
})

describe('computeX01Stats best leg pairing', () => {
  it('pairs bestLegDarts with the highest-average leg', () => {
    const stats = computeX01Stats([
      sampleSession({
        id: 'hot-leg',
        visits: [
          sampleVisit({
            visitScore: 100,
            scoreBefore: 501,
            scoreAfter: 401,
            darts: [
              numberDart(20, DartMultiplier.Triple),
              numberDart(20, DartMultiplier.Single),
              numberDart(20, DartMultiplier.Single),
            ],
          }),
          sampleVisit({
            visitIndex: 1,
            checkout: true,
            visitScore: 100,
            scoreBefore: 100,
            scoreAfter: 0,
            darts: [
              numberDart(20, DartMultiplier.Triple),
              numberDart(20, DartMultiplier.Triple),
              numberDart(20, DartMultiplier.Single),
            ],
          }),
        ],
      }),
      sampleSession({
        id: 'cold-leg',
        visits: [
          sampleVisit({
            visitScore: 40,
            scoreBefore: 501,
            scoreAfter: 461,
            darts: [numberDart(20, DartMultiplier.Single), numberDart(20, DartMultiplier.Single)],
          }),
          sampleVisit({
            visitIndex: 1,
            checkout: true,
            visitScore: 40,
            scoreBefore: 40,
            scoreAfter: 0,
            darts: [numberDart(20, DartMultiplier.Double)],
          }),
        ],
      }),
    ])

    expect(stats.fiveOhOne.bestLegAverage).toBe(100)
    expect(stats.fiveOhOne.bestLegDarts).toBe(6)
  })

  it('breaks equal averages by preferring fewer darts', () => {
    const stats = computeX01Stats([
      sampleSession({
        id: 'longer',
        visits: [
          sampleVisit({
            visitScore: 60,
            darts: [
              numberDart(20, DartMultiplier.Triple),
              numberDart(20, DartMultiplier.Triple),
              numberDart(20, DartMultiplier.Triple),
            ],
          }),
          sampleVisit({
            visitIndex: 1,
            visitScore: 60,
            scoreBefore: 441,
            scoreAfter: 381,
            darts: [
              numberDart(20, DartMultiplier.Triple),
              numberDart(20, DartMultiplier.Triple),
              numberDart(20, DartMultiplier.Triple),
            ],
          }),
          sampleVisit({
            visitIndex: 2,
            checkout: true,
            visitScore: 60,
            scoreBefore: 60,
            scoreAfter: 0,
            darts: [
              numberDart(20, DartMultiplier.Triple),
              numberDart(20, DartMultiplier.Triple),
              numberDart(20, DartMultiplier.Triple),
            ],
          }),
        ],
      }),
      sampleSession({
        id: 'shorter',
        visits: [
          sampleVisit({
            visitScore: 100,
            darts: [
              numberDart(20, DartMultiplier.Triple),
              numberDart(20, DartMultiplier.Single),
              numberDart(20, DartMultiplier.Single),
            ],
          }),
          sampleVisit({
            visitIndex: 1,
            checkout: true,
            visitScore: 20,
            scoreBefore: 20,
            scoreAfter: 0,
            darts: [numberDart(20, DartMultiplier.Single)],
          }),
        ],
      }),
    ])

    // longer: avg 60 over 9 darts; shorter: avg 60 over 4 darts
    expect(stats.fiveOhOne.bestLegAverage).toBe(60)
    expect(stats.fiveOhOne.bestLegDarts).toBe(4)
  })
})

describe('computeX01Stats online 501 and detail stats', () => {
  const onlinePlayers = [
    { id: 'player-1', name: 'You', kind: PlayerKind.Human },
    { id: 'player-2', name: 'Them', kind: PlayerKind.Remote },
  ]

  it('keeps online 501 separate from local 501', () => {
    const stats = computeX01Stats([
      sampleSession({ id: 'local' }),
      sampleSession({ id: 'online', players: onlinePlayers }),
    ])

    expect(stats.fiveOhOne.legCount).toBe(2)
    expect(stats.fiveOhOneOnline.legCount).toBe(1)
  })

  it('counts darts thrown and leg win rate only for contested legs', () => {
    const stats = computeX01Stats([
      sampleSession({ id: 'solo' }),
      sampleSession({
        id: 'won',
        players: onlinePlayers,
        visits: [
          sampleVisit({
            checkout: true,
            visitScore: 60,
            scoreBefore: 60,
            scoreAfter: 0,
          }),
        ],
      }),
      sampleSession({ id: 'lost', players: onlinePlayers }),
    ])

    expect(stats.fiveOhOne.dartsThrown).toBe(3)
    expect(stats.fiveOhOne.legWinRate).toBe(50)
    expect(computeX01Stats([sampleSession()]).fiveOhOne.legWinRate).toBeNull()
  })

  it('returns empty online stats without online games', () => {
    const stats = computeX01Stats([sampleSession()])

    expect(stats.fiveOhOneOnline.legCount).toBe(0)
    expect(stats.fiveOhOneOnline.dartsThrown).toBe(0)
  })
})
