import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { isOnlineSession } from './sessionScope.ts'

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

describe('isOnlineSession', () => {
  it('is true for a live remote match', () => {
    expect(
      isOnlineSession(
        session({
          players: [
            { id: 'user-a', name: 'You', kind: PlayerKind.Human },
            { id: 'user-b', name: 'Opp', kind: PlayerKind.Remote },
          ],
        }),
      ),
    ).toBe(true)
  })

  it('is false for an imported copy with sourceOnlineMatchId', () => {
    expect(
      isOnlineSession(
        session({
          sourceOnlineMatchId: 'match-1',
          players: [
            { id: 'user-a', name: 'You', kind: PlayerKind.Human },
            { id: 'user-b', name: 'Opp', kind: PlayerKind.Remote },
          ],
        }),
      ),
    ).toBe(false)
  })
})
