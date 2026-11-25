import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { excludeMirroredOnlineMatchCopies } from './excludeMirroredOnlineMatchCopies'

const session = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  mode: GameModeId.X01,
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [{ id: 'player-1', name: 'You', kind: PlayerKind.Human }],
  visits: [],
  status: GameStatus.Completed,
  startedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('excludeMirroredOnlineMatchCopies', () => {
  it('keeps practice sessions and unmatched converted copies', () => {
    const practice = session({ id: 'practice' })
    const converted = session({ id: 'copy', sourceOnlineMatchId: 'match-missing' })

    expect(excludeMirroredOnlineMatchCopies([practice, converted], new Set(['match-1']))).toEqual([
      practice,
      converted,
    ])
  })

  it('drops a stored copy when that online match id is loaded', () => {
    const practice = session({ id: 'practice' })
    const converted = session({ id: 'copy', sourceOnlineMatchId: 'match-1' })

    expect(excludeMirroredOnlineMatchCopies([practice, converted], new Set(['match-1']))).toEqual([
      practice,
    ])
  })
})
