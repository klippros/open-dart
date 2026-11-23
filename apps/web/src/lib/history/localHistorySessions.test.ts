import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { getLocalHistorySessions } from './localHistorySessions'

const session = (id: string, opponentKind: PlayerKind | null): GameSession => ({
  id,
  mode: GameModeId.X01,
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [
    { id: 'player-1', name: 'You', kind: PlayerKind.Human },
    ...(opponentKind === null ? [] : [{ id: 'player-2', name: 'Them', kind: opponentKind }]),
  ],
  visits: [],
  status: GameStatus.Completed,
  startedAt: '2026-01-01T10:00:00.000Z',
  completedAt: '2026-01-01T10:00:00.000Z',
})

describe('getLocalHistorySessions', () => {
  const solo = session('solo', null)
  const local = session('local', PlayerKind.Human)
  const online = session('online', PlayerKind.Remote)

  it('leaves online matches out while online history is shown', () => {
    expect(getLocalHistorySessions([solo, online, local], true)).toEqual([solo, local])
  })

  it('keeps every stored session when online history is hidden', () => {
    expect(getLocalHistorySessions([solo, online, local], false)).toEqual([solo, online, local])
  })
})
