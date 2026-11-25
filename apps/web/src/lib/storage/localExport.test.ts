import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { ActiveGameSnapshot } from '@open-dart/game/types/activeGameSnapshot'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { SingleDartScoringMode } from '../../types/settings'
import type { AppSettings } from '../../types/settings'
import { loadActiveSnapshot, loadStoredSessions } from './gameStore'
import { HISTORY_EXPORT_VERSION } from './historyExport'
import { LOCAL_EXPORT_VERSION, buildLocalExport, importLocalExport } from './localExport'
import type { StorageAdapter } from './localStorageAdapter'
import { loadSettings } from './settingsStore'
import { StorageKey } from './storageKeys'

const createMemoryStorage = (): StorageAdapter & { data: Map<string, string> } => {
  const data = new Map<string, string>()

  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

const sampleSession = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  mode: GameModeId.X01,
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [{ id: 'player-1', name: 'You', kind: PlayerKind.Human }],
  visits: [],
  status: GameStatus.Completed,
  startedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const sampleSnapshot = (session: GameSession = sampleSession()): ActiveGameSnapshot => ({
  session,
  turnIndex: 1,
  pendingDarts: [],
  savedAt: '2026-01-02T00:00:00.000Z',
})

const sampleSettings = (): AppSettings => ({
  scoreCallerEnabled: false,
  uiSoundsEnabled: true,
  singleDartScoring: SingleDartScoringMode.Always,
  enableInputSwiping: true,
})

const emptyFile = () => ({
  version: LOCAL_EXPORT_VERSION,
  sessions: [],
  activeSession: null,
  settings: null,
  syncQueue: null,
  syncDeleteQueue: null,
  lastSyncAt: null,
})

describe('localExport', () => {
  it('exports logical fields without storage key names', () => {
    const storage = createMemoryStorage()
    const session = sampleSession()
    const snapshot = sampleSnapshot(session)
    const settings = sampleSettings()

    storage.setItem(StorageKey.Sessions, JSON.stringify([session]))
    storage.setItem(StorageKey.ActiveSession, JSON.stringify(snapshot))
    storage.setItem(StorageKey.Settings, JSON.stringify(settings))
    storage.setItem(StorageKey.SyncQueue, JSON.stringify(['session-1']))
    storage.setItem(StorageKey.SyncDeleteQueue, JSON.stringify(['session-9']))
    storage.setItem(StorageKey.LastSyncAt, '2026-03-01T00:00:00.000Z')

    const exported = buildLocalExport(storage)

    expect(Object.keys(exported)).toEqual([
      'version',
      'sessions',
      'activeSession',
      'settings',
      'syncQueue',
      'syncDeleteQueue',
      'lastSyncAt',
    ])
    expect(exported).toEqual({
      version: LOCAL_EXPORT_VERSION,
      sessions: [session],
      activeSession: snapshot,
      settings,
      syncQueue: ['session-1'],
      syncDeleteQueue: ['session-9'],
      lastSyncAt: '2026-03-01T00:00:00.000Z',
    })
    expect(JSON.stringify(exported)).not.toContain('open-darts:')
  })

  it('imports an export back into the same stats', () => {
    const storage = createMemoryStorage()
    const first = sampleSession({
      id: 'session-1',
      visits: [
        {
          visitIndex: 0,
          playerId: 'player-1',
          darts: [],
          visitScore: 60,
          scoreBefore: 501,
          scoreAfter: 441,
          bust: false,
          checkout: false,
        },
      ],
    })
    const second = sampleSession({
      id: 'session-2',
      startedAt: '2026-02-01T00:00:00.000Z',
      visits: [
        {
          visitIndex: 0,
          playerId: 'player-1',
          darts: [],
          visitScore: 100,
          scoreBefore: 501,
          scoreAfter: 401,
          bust: false,
          checkout: true,
        },
      ],
    })
    const snapshot = sampleSnapshot(second)
    const settings = sampleSettings()

    storage.setItem(StorageKey.Sessions, JSON.stringify([first, second]))
    storage.setItem(StorageKey.ActiveSession, JSON.stringify(snapshot))
    storage.setItem(StorageKey.Settings, JSON.stringify(settings))
    storage.setItem(StorageKey.SyncQueue, JSON.stringify(['session-2']))
    storage.setItem(StorageKey.SyncDeleteQueue, JSON.stringify(['session-9']))
    storage.setItem(StorageKey.LastSyncAt, '2026-03-01T00:00:00.000Z')

    const exported = buildLocalExport(storage)
    const destination = createMemoryStorage()

    expect(importLocalExport(JSON.stringify(exported), destination)).toBe(true)
    expect(buildLocalExport(destination)).toEqual(exported)
    expect(loadStoredSessions(destination)).toEqual([first, second])
    expect(loadActiveSnapshot(destination)).toEqual(snapshot)
    expect(loadSettings(destination)).toEqual(settings)

    expect(importLocalExport(JSON.stringify(exported), storage)).toBe(true)
    expect(buildLocalExport(storage)).toEqual(exported)
  })

  it('merges imported sessions by id and lets the file win', () => {
    const storage = createMemoryStorage()
    const kept = sampleSession({ id: 'kept' })
    const original = sampleSession({ id: 'shared', startedAt: '2026-01-01T00:00:00.000Z' })
    const incoming = sampleSession({ id: 'shared', startedAt: '2026-04-01T00:00:00.000Z' })
    const added = sampleSession({ id: 'added' })
    const snapshot = sampleSnapshot(incoming)
    const settings = sampleSettings()

    storage.setItem(StorageKey.Sessions, JSON.stringify([kept, original]))

    const imported = importLocalExport(
      JSON.stringify({
        ...emptyFile(),
        sessions: [incoming, added],
        activeSession: snapshot,
        settings,
        syncQueue: ['added'],
        syncDeleteQueue: [],
        lastSyncAt: '2026-04-02T00:00:00.000Z',
      }),
      storage,
    )

    expect(imported).toBe(true)
    expect(loadStoredSessions(storage)).toEqual([kept, incoming, added])
    expect(loadActiveSnapshot(storage)).toEqual(snapshot)
    expect(loadSettings(storage)).toEqual(settings)
    expect(storage.getItem(StorageKey.SyncQueue)).toBe(JSON.stringify(['added']))
    expect(storage.data.has(StorageKey.SyncDeleteQueue)).toBe(false)
    expect(storage.getItem(StorageKey.LastSyncAt)).toBe('2026-04-02T00:00:00.000Z')
  })

  it('rejects a bad file and leaves storage untouched', () => {
    const storage = createMemoryStorage()
    const existing = sampleSession()

    storage.setItem(StorageKey.Sessions, JSON.stringify([existing]))
    storage.setItem(StorageKey.Settings, JSON.stringify(sampleSettings()))

    const before = new Map(storage.data)

    expect(importLocalExport('{not-json', storage)).toBe(false)
    expect(
      importLocalExport(
        JSON.stringify({
          version: HISTORY_EXPORT_VERSION,
          ownerUserId: null,
          sessions: [{ id: 'broken' }],
          onlineMatches: [],
        }),
        storage,
      ),
    ).toBe(false)
    expect(
      importLocalExport(
        JSON.stringify({
          ...emptyFile(),
          sessions: [{ id: 'broken' }],
        }),
        storage,
      ),
    ).toBe(false)
    expect(importLocalExport(JSON.stringify({ hello: 'world' }), storage)).toBe(false)
    expect(storage.data).toEqual(before)
    expect(loadStoredSessions(storage)).toEqual([existing])
  })

  it('imports version-2 online matches as local sessions with a new id', () => {
    const storage = createMemoryStorage()
    const practice = sampleSession({ id: 'practice-1' })
    const onlineMatch = sampleSession({
      id: 'match-1',
      players: [
        { id: 'user-a', name: 'You', kind: PlayerKind.Human },
        { id: 'user-b', name: 'Opp', kind: PlayerKind.Remote },
      ],
    })
    let nextId = 0

    expect(
      importLocalExport(
        JSON.stringify({
          version: HISTORY_EXPORT_VERSION,
          ownerUserId: 'user-a',
          sessions: [practice],
          onlineMatches: [onlineMatch],
        }),
        storage,
        {
          createSessionId: () => {
            nextId += 1
            return `imported-${nextId}`
          },
        },
      ),
    ).toBe(true)

    const stored = loadStoredSessions(storage)
    expect(stored).toHaveLength(2)
    expect(stored.find((session) => session.id === 'practice-1')).toEqual(practice)
    expect(stored.find((session) => session.id === 'imported-1')).toEqual({
      ...onlineMatch,
      id: 'imported-1',
      sourceOnlineMatchId: 'match-1',
    })
    expect(storage.getItem(StorageKey.Settings)).toBeNull()
    expect(storage.getItem(StorageKey.SyncQueue)).toBeNull()
  })

  it('skips version-2 duplicates across local ids, source ids, and blocked online matches', () => {
    const storage = createMemoryStorage()
    const existingPractice = sampleSession({ id: 'practice-1' })
    const existingCopy = sampleSession({
      id: 'copy-1',
      sourceOnlineMatchId: 'match-existing',
    })
    storage.setItem(StorageKey.Sessions, JSON.stringify([existingPractice, existingCopy]))

    expect(
      importLocalExport(
        JSON.stringify({
          version: HISTORY_EXPORT_VERSION,
          ownerUserId: null,
          sessions: [
            sampleSession({ id: 'practice-1' }),
            sampleSession({ id: 'copy-2', sourceOnlineMatchId: 'match-existing' }),
            sampleSession({ id: 'fresh-practice' }),
          ],
          onlineMatches: [
            sampleSession({ id: 'match-existing' }),
            sampleSession({ id: 'match-blocked' }),
            sampleSession({ id: 'match-new' }),
            sampleSession({ id: 'match-new' }),
          ],
        }),
        storage,
        {
          blockedOnlineMatchIds: ['match-blocked'],
          createSessionId: () => 'imported-new',
        },
      ),
    ).toBe(true)

    const stored = loadStoredSessions(storage)
    expect(stored.map((session) => session.id).sort()).toEqual([
      'copy-1',
      'fresh-practice',
      'imported-new',
      'practice-1',
    ])
    expect(stored.find((session) => session.id === 'imported-new')?.sourceOnlineMatchId).toBe(
      'match-new',
    )
  })

  it('importing the same version-2 file twice does not add games', () => {
    const storage = createMemoryStorage()
    const file = {
      version: HISTORY_EXPORT_VERSION,
      ownerUserId: null,
      sessions: [sampleSession({ id: 'practice-1' })],
      onlineMatches: [sampleSession({ id: 'match-1' })],
    }
    let nextId = 0
    const options = {
      createSessionId: () => {
        nextId += 1
        return `imported-${nextId}`
      },
    }

    expect(importLocalExport(JSON.stringify(file), storage, options)).toBe(true)
    const afterFirst = loadStoredSessions(storage)
    expect(importLocalExport(JSON.stringify(file), storage, options)).toBe(true)
    expect(loadStoredSessions(storage)).toEqual(afterFirst)
  })
})
