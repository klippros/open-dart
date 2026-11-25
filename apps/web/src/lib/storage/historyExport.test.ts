import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { HISTORY_EXPORT_VERSION, buildHistoryExport } from './historyExport'

const sampleSession = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  mode: GameModeId.X01,
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [{ id: 'player-1', name: 'You', kind: PlayerKind.Human }],
  visits: [],
  status: GameStatus.Completed,
  startedAt: '2025-01-01T00:00:00.000Z',
  completedAt: '2025-01-01T00:10:00.000Z',
  ...overrides,
})

describe('buildHistoryExport', () => {
  it('unions local and cloud practice games and includes every online match', () => {
    const localOnly = sampleSession({ id: 'local-only' })
    const sharedLocal = sampleSession({
      id: 'shared',
      startedAt: '2025-02-01T00:00:00.000Z',
      completedAt: '2025-02-01T00:10:00.000Z',
    })
    const sharedCloud = sampleSession({
      id: 'shared',
      startedAt: '2025-01-15T00:00:00.000Z',
      completedAt: '2025-01-15T00:10:00.000Z',
    })
    const cloudOnly = sampleSession({
      id: 'cloud-only',
      startedAt: '2024-06-01T00:00:00.000Z',
      completedAt: '2024-06-01T00:10:00.000Z',
    })
    const onlineMatch = sampleSession({
      id: 'match-1',
      players: [
        { id: 'user-a', name: 'You', kind: PlayerKind.Human },
        { id: 'user-b', name: 'Opp', kind: PlayerKind.Remote },
      ],
      startedAt: '2024-01-01T00:00:00.000Z',
      completedAt: '2024-01-01T00:20:00.000Z',
    })

    const exported = buildHistoryExport({
      ownerUserId: 'user-a',
      localSessions: [localOnly, sharedLocal],
      cloudPracticeSessions: [sharedCloud, cloudOnly],
      onlineMatches: [onlineMatch],
    })

    expect(exported.version).toBe(HISTORY_EXPORT_VERSION)
    expect(exported.ownerUserId).toBe('user-a')
    expect(exported.sessions.map((session) => session.id).sort()).toEqual([
      'cloud-only',
      'local-only',
      'shared',
    ])
    expect(exported.sessions.find((session) => session.id === 'shared')).toEqual(sharedLocal)
    expect(exported.onlineMatches).toEqual([onlineMatch])
  })

  it('omits a local converted copy when the online match is already in the file', () => {
    const converted = sampleSession({
      id: 'local-copy',
      sourceOnlineMatchId: 'match-1',
    })
    const onlineMatch = sampleSession({ id: 'match-1' })

    const exported = buildHistoryExport({
      ownerUserId: 'user-a',
      localSessions: [converted],
      onlineMatches: [onlineMatch],
    })

    expect(exported.sessions).toEqual([])
    expect(exported.onlineMatches).toEqual([onlineMatch])
  })

  it('does not apply a date cutoff', () => {
    const oldPractice = sampleSession({
      id: 'old',
      startedAt: '2020-01-01T00:00:00.000Z',
      completedAt: '2020-01-01T00:10:00.000Z',
    })
    const oldMatch = sampleSession({
      id: 'old-match',
      startedAt: '2019-01-01T00:00:00.000Z',
      completedAt: '2019-01-01T00:10:00.000Z',
    })

    const exported = buildHistoryExport({
      ownerUserId: null,
      localSessions: [oldPractice],
      onlineMatches: [oldMatch],
    })

    expect(exported.sessions).toEqual([oldPractice])
    expect(exported.onlineMatches).toEqual([oldMatch])
  })
})
