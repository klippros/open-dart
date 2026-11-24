import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { filterSessions, getDateRangeCutoff } from './sessionFilters'

const sampleSession = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  mode: GameModeId.X01,
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [{ id: 'player-1', name: 'You', kind: PlayerKind.Human }],
  visits: [],
  status: GameStatus.Completed,
  startedAt: '2026-01-01T10:00:00.000Z',
  completedAt: '2026-01-01T10:00:00.000Z',
  ...overrides,
})

describe('getDateRangeCutoff', () => {
  it('returns null for all time', () => {
    expect(getDateRangeCutoff('all')).toBeNull()
  })

  it('returns an absolute now-minus-N-days ISO instant', () => {
    const now = new Date('2026-03-15T12:00:00.000Z')

    expect(getDateRangeCutoff('7d', now)).toBe('2026-03-08T12:00:00.000Z')
    expect(getDateRangeCutoff('30d', now)).toBe('2026-02-13T12:00:00.000Z')
  })
})

describe('filterSessions', () => {
  it('filters completed sessions by the absolute cutoff', () => {
    const recent = sampleSession({
      id: 'recent',
      completedAt: new Date().toISOString(),
    })
    const older = sampleSession({
      id: 'older',
      completedAt: '2020-01-01T10:00:00.000Z',
    })

    expect(filterSessions([recent, older], { dateRange: '7d' }).map((s) => s.id)).toEqual([
      'recent',
    ])
  })
})
