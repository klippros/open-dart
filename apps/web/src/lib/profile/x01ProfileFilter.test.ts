import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { DartMultiplier } from '@open-dart/game/types/dart'
import { numberDart } from '@open-dart/game/testHelpers'
import { computeX01Stats, X01StatsFilterId } from '@open-dart/analytics/x01Stats'
import {
  X01_PROFILE_VARIANTS,
  getX01VariantStats,
  parseX01ProfileVariant,
  pickDefaultX01Variant,
} from './x01ProfileFilter'

const session = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  mode: GameModeId.X01,
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [{ id: 'player-1', name: 'You', kind: PlayerKind.Human }],
  visits: [
    {
      visitIndex: 0,
      playerId: 'player-1',
      darts: [numberDart(20, DartMultiplier.Triple)],
      visitScore: 60,
      scoreBefore: 501,
      scoreAfter: 441,
      bust: false,
      checkout: false,
    },
  ],
  status: GameStatus.Completed,
  startedAt: '2026-01-01T10:00:00.000Z',
  completedAt: '2026-01-01T10:00:00.000Z',
  ...overrides,
})

describe('x01ProfileFilter', () => {
  it('lists 501 online, 501, 170, and All in that order', () => {
    expect(X01_PROFILE_VARIANTS.map((variant) => variant.label)).toEqual([
      '501 online',
      '501',
      '170',
      'All',
    ])
  })

  it('defaults to the first variant with legs', () => {
    expect(pickDefaultX01Variant(computeX01Stats([session()]))).toBe(X01StatsFilterId.FiveOhOne)
    expect(
      pickDefaultX01Variant(
        computeX01Stats([
          session({
            players: [
              { id: 'player-1', name: 'You', kind: PlayerKind.Human },
              { id: 'player-2', name: 'Them', kind: PlayerKind.Remote },
            ],
          }),
        ]),
      ),
    ).toBe(X01StatsFilterId.FiveOhOneOnline)
    expect(pickDefaultX01Variant(computeX01Stats([]))).toBe(X01StatsFilterId.FiveOhOneOnline)
  })

  it('maps variant ids to their stats', () => {
    const stats = computeX01Stats([session()])
    expect(getX01VariantStats(stats, X01StatsFilterId.All).legCount).toBe(1)
    expect(getX01VariantStats(stats, X01StatsFilterId.OneSeventy).legCount).toBe(0)
  })

  it('parses toggle values', () => {
    expect(parseX01ProfileVariant('501-online')).toBe(X01StatsFilterId.FiveOhOneOnline)
    expect(parseX01ProfileVariant('nope')).toBeNull()
  })
})
