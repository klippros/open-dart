import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { SyncStatus } from '../../types/auth'
import { loadStoredSessions, saveStoredSession } from '../storage/gameStore'
import type { StorageAdapter } from '../storage/localStorageAdapter'
import { StorageKey } from '../storage/storageKeys'
import {
  clearSyncedLocalSessionData,
  createSupabaseSessionGateway,
  deleteSyncedSessionAndRefresh,
  flushPendingSessionSync,
  queueCompletedSessionSync,
  retrySessionSync,
  startSessionSyncWithGateway,
  stopSessionSync,
  synchronizeSessions,
} from './sessionSync'
import type { SessionSyncGateway } from './sessionSync'

const unusedDeleteSession = async (): Promise<boolean> => false

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

const createLocalStorageMock = () => {
  const storage = createMemoryStorage()

  return {
    ...storage,
    clear: () => {
      storage.data.clear()
    },
    key: (index: number) => [...storage.data.keys()][index] ?? null,
    get length() {
      return storage.data.size
    },
  }
}

const session = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  mode: GameModeId.X01,
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [{ id: 'player-1', name: 'You', kind: PlayerKind.Human }],
  visits: [],
  status: GameStatus.Completed,
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: '2026-01-01T00:10:00.000Z',
  ...overrides,
})

beforeEach(() => {
  stopSessionSync()
  vi.stubGlobal('localStorage', createLocalStorageMock())
})

describe('synchronizeSessions', () => {
  it('merges local progress and is idempotent after the remote upsert', async () => {
    const storage = createMemoryStorage()
    const local = session()
    let remote: GameSession[] = []
    const upsertSessions = vi.fn(async (sessions: GameSession[]) => {
      remote = sessions
    })
    const gateway: SessionSyncGateway = {
      loadSessions: async () => remote,
      upsertSessions,
      deleteSessions: async () => undefined,
      deleteSession: unusedDeleteSession,
    }
    saveStoredSession(local, storage)

    await synchronizeSessions(gateway, storage)
    await synchronizeSessions(gateway, storage)

    expect(loadStoredSessions(storage)).toEqual([local])
    expect(upsertSessions).toHaveBeenCalledTimes(1)
    expect(storage.getItem(StorageKey.SyncQueue)).toBeNull()
  })

  it('keeps local progress queued when an upload fails', async () => {
    const storage = createMemoryStorage()
    const local = session()
    const gateway: SessionSyncGateway = {
      loadSessions: async () => [],
      upsertSessions: async () => {
        throw new Error('offline')
      },
      deleteSessions: async () => undefined,
      deleteSession: unusedDeleteSession,
    }
    saveStoredSession(local, storage)

    await expect(synchronizeSessions(gateway, storage)).rejects.toThrow('offline')

    expect(loadStoredSessions(storage)).toEqual([local])
    expect(JSON.parse(storage.getItem(StorageKey.SyncQueue) ?? '[]')).toEqual([local.id])
  })
})

describe('completed-session queue', () => {
  it('does not queue remote work while anonymous', () => {
    queueCompletedSessionSync(session())

    expect(localStorage.getItem(StorageKey.SyncQueue)).toBeNull()
  })

  it('uploads completed sessions after authenticated sync starts', async () => {
    const upsertSessions = vi.fn(async () => undefined)
    const statusChanges: SyncStatus[] = []
    const gateway: SessionSyncGateway = {
      loadSessions: async () => [],
      upsertSessions,
      deleteSessions: async () => undefined,
      deleteSession: unusedDeleteSession,
    }

    await startSessionSyncWithGateway(gateway, (status) => {
      statusChanges.push(status)
    })
    const completed = session()
    saveStoredSession(completed)
    queueCompletedSessionSync(completed)
    await retrySessionSync()

    expect(upsertSessions).toHaveBeenCalledWith([completed])
    expect(statusChanges).toContain(SyncStatus.Synced)
    expect(localStorage.getItem(StorageKey.SyncQueue)).toBeNull()
  })
})

describe('clearSyncedLocalSessionData', () => {
  it('removes completed sessions that have been synced', () => {
    const storage = createMemoryStorage()
    const completed = session()
    const inProgress = session({
      id: 'session-2',
      status: GameStatus.InProgress,
      completedAt: undefined,
    })
    saveStoredSession(completed, storage)
    saveStoredSession(inProgress, storage)
    storage.setItem(StorageKey.LastSyncAt, '2026-01-01T00:00:00.000Z')

    clearSyncedLocalSessionData(storage)

    expect(loadStoredSessions(storage)).toEqual([inProgress])
    expect(storage.getItem(StorageKey.SyncQueue)).toBeNull()
    expect(storage.getItem(StorageKey.SyncDeleteQueue)).toBeNull()
    expect(storage.getItem(StorageKey.LastSyncAt)).toBeNull()
  })

  it('keeps completed sessions that are still waiting to upload', () => {
    const storage = createMemoryStorage()
    const completed = session()
    saveStoredSession(completed, storage)
    storage.setItem(StorageKey.SyncQueue, JSON.stringify([completed.id]))

    clearSyncedLocalSessionData(storage)

    expect(loadStoredSessions(storage)).toEqual([completed])
    expect(JSON.parse(storage.getItem(StorageKey.SyncQueue) ?? '[]')).toEqual([completed.id])
  })
})

describe('flushPendingSessionSync', () => {
  it('uploads queued sessions before sign-out cleanup', async () => {
    const upsertSessions = vi.fn(async () => undefined)
    const gateway: SessionSyncGateway = {
      loadSessions: async () => [],
      upsertSessions,
      deleteSessions: async () => undefined,
      deleteSession: unusedDeleteSession,
    }

    await startSessionSyncWithGateway(gateway, () => undefined)
    const completed = session()
    saveStoredSession(completed)
    localStorage.setItem(StorageKey.SyncQueue, JSON.stringify([completed.id]))

    await flushPendingSessionSync()
    clearSyncedLocalSessionData()

    expect(upsertSessions).toHaveBeenCalledWith([completed])
    expect(loadStoredSessions()).toEqual([])
  })
})

describe('deleteSyncedSessionAndRefresh', () => {
  it('removes a pending upload before refetching after a successful delete', async () => {
    const completed = session()
    const deleteSession = vi.fn(async () => true)
    const loadSessions = vi.fn(async () => [] as GameSession[])
    const gateway: SessionSyncGateway = {
      loadSessions,
      upsertSessions: async () => undefined,
      deleteSessions: async () => undefined,
      deleteSession,
    }

    await startSessionSyncWithGateway(gateway, () => undefined)
    saveStoredSession(completed)
    localStorage.setItem(StorageKey.SyncQueue, JSON.stringify([completed.id]))

    const result = await deleteSyncedSessionAndRefresh(completed.id)

    expect(result).toEqual({ ok: true, sessions: [] })
    expect(deleteSession).toHaveBeenCalledWith(completed.id)
    expect(loadSessions).toHaveBeenCalled()
    expect(loadStoredSessions()).toEqual([])
    expect(localStorage.getItem(StorageKey.SyncQueue)).toBeNull()
  })

  it('removes a never-uploaded session when the rpc returns false', async () => {
    const completed = session()
    const gateway: SessionSyncGateway = {
      loadSessions: async () => [],
      upsertSessions: async () => undefined,
      deleteSessions: async () => undefined,
      deleteSession: async () => false,
    }

    await startSessionSyncWithGateway(gateway, () => undefined)
    saveStoredSession(completed)

    const result = await deleteSyncedSessionAndRefresh(completed.id)

    expect(result).toEqual({ ok: true, sessions: [] })
    expect(loadStoredSessions()).toEqual([])
  })

  it('leaves storage unchanged when the rpc fails', async () => {
    const completed = session()
    const gateway: SessionSyncGateway = {
      loadSessions: async () => [],
      upsertSessions: async () => undefined,
      deleteSessions: async () => undefined,
      deleteSession: async () => {
        throw new Error('network')
      },
    }

    await startSessionSyncWithGateway(gateway, () => undefined)
    saveStoredSession(completed)

    const result = await deleteSyncedSessionAndRefresh(completed.id)

    expect(result).toEqual({ ok: false, error: 'Could not delete this game' })
    expect(loadStoredSessions()).toEqual([completed])
    expect(localStorage.getItem(StorageKey.SyncDeleteQueue)).toBeNull()
  })

  it('keeps the local deletion when refetch fails after a committed delete', async () => {
    const completed = session()
    const other = session({ id: 'session-2' })
    const gateway: SessionSyncGateway = {
      loadSessions: async () => {
        throw new Error('offline')
      },
      upsertSessions: async () => undefined,
      deleteSessions: async () => undefined,
      deleteSession: async () => true,
    }

    await startSessionSyncWithGateway(gateway, () => undefined)
    saveStoredSession(completed)
    saveStoredSession(other)

    const result = await deleteSyncedSessionAndRefresh(completed.id)

    expect(result).toEqual({ ok: true, sessions: [other] })
    expect(loadStoredSessions()).toEqual([other])
    expect(JSON.parse(localStorage.getItem(StorageKey.SyncQueue) ?? '[]')).not.toContain(
      completed.id,
    )
  })

  it('excludes a deleted id so a stale remote payload cannot restore it', async () => {
    const completed = session()
    const gateway: SessionSyncGateway = {
      loadSessions: async () => [completed],
      upsertSessions: async () => undefined,
      deleteSessions: async () => undefined,
      deleteSession: async () => true,
    }

    await startSessionSyncWithGateway(gateway, () => undefined)
    saveStoredSession(completed)

    const result = await deleteSyncedSessionAndRefresh(completed.id)

    expect(result).toEqual({ ok: true, sessions: [] })
    expect(loadStoredSessions()).toEqual([])
  })
})

describe('Supabase ownership boundary', () => {
  it('does not send a client-provided user id when upserting', async () => {
    const rpc = vi.fn(async (_name: string, arguments_: Record<string, unknown>) => ({
      data: arguments_.session_id,
      error: null,
    }))
    const client = { rpc } as unknown as SupabaseClient
    const gateway = createSupabaseSessionGateway(client)
    const completed = session()

    await gateway.upsertSessions([completed])

    expect(rpc).toHaveBeenCalledOnce()
    expect(rpc.mock.calls[0]?.[0]).toBe('upsert_game_session')
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty('user_id')
  })

  it('rejects an upload when the database does not confirm the write', async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: null,
      })),
    } as unknown as SupabaseClient
    const gateway = createSupabaseSessionGateway(client)
    const completed = session()

    await expect(gateway.upsertSessions([completed])).rejects.toThrow(
      `Database did not confirm session upload: ${completed.id}`,
    )
  })

  it('skips sessions rejected as online match ids without failing the batch', async () => {
    const rpc = vi.fn(async (_name: string, arguments_: Record<string, unknown>) => {
      if (arguments_.session_id === 'online-1') {
        return {
          data: null,
          error: { message: 'online_match_id_not_allowed', code: '23514' },
        }
      }

      return { data: arguments_.session_id, error: null }
    })
    const client = { rpc } as unknown as SupabaseClient
    const gateway = createSupabaseSessionGateway(client)

    await expect(
      gateway.upsertSessions([session({ id: 'online-1' }), session({ id: 'local-1' })]),
    ).resolves.toBeUndefined()

    expect(rpc).toHaveBeenCalledTimes(2)
  })

  it('does not send a client-provided user id when deleting', async () => {
    const rpc = vi.fn(async (_name: string, _arguments: Record<string, unknown>) => ({
      data: true,
      error: null,
    }))
    const client = { rpc } as unknown as SupabaseClient
    const gateway = createSupabaseSessionGateway(client)

    await expect(gateway.deleteSession('session-1')).resolves.toBe(true)

    expect(rpc).toHaveBeenCalledOnce()
    expect(rpc.mock.calls[0]?.[0]).toBe('delete_local_game_session')
    expect(rpc.mock.calls[0]?.[1]).toEqual({ session_id: 'session-1' })
    expect(rpc.mock.calls[0]?.[1]).not.toHaveProperty('user_id')
  })
})
