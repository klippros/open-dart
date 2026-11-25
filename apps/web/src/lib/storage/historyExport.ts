import type { GameSession } from '@open-dart/game/types/gameSession'
import type { SupabaseClient } from '@supabase/supabase-js'
import { listAllMyOnlineMatchSessions } from '../matchServer/api'
import { decorateOnlineSessionForViewer } from '../matchServer/onlinePlay'
import { supabaseClient } from '../supabase/client'
import { isGameSession, loadStoredSessions } from './gameStore'
import type { StorageAdapter } from './localStorageAdapter'
import { browserLocalStorage } from './localStorageAdapter'

export const HISTORY_EXPORT_VERSION = 2
export const HISTORY_EXPORT_FILENAME = 'open-darts-history.json'

const PRACTICE_SESSION_PAGE_SIZE = 1000

export interface HistoryExportFile {
  version: typeof HISTORY_EXPORT_VERSION
  ownerUserId: string | null
  sessions: GameSession[]
  onlineMatches: GameSession[]
}

export interface BuildHistoryExportInput {
  ownerUserId: string | null
  viewerDisplayName?: string | null
  localSessions?: readonly GameSession[]
  cloudPracticeSessions?: readonly GameSession[]
  onlineMatches?: readonly GameSession[]
}

const mergePracticeSessions = (
  localSessions: readonly GameSession[],
  cloudSessions: readonly GameSession[],
): GameSession[] => {
  const byId = new Map<string, GameSession>()

  for (const session of cloudSessions) {
    byId.set(session.id, session)
  }

  for (const session of localSessions) {
    byId.set(session.id, session)
  }

  return [...byId.values()]
}

export const buildHistoryExport = (input: BuildHistoryExportInput): HistoryExportFile => {
  const onlineMatches = [...(input.onlineMatches ?? [])]
  const onlineMatchIds = new Set(onlineMatches.map((session) => session.id))
  const practiceSessions = mergePracticeSessions(
    input.localSessions ?? [],
    input.cloudPracticeSessions ?? [],
  ).filter(
    (session) =>
      session.sourceOnlineMatchId === undefined || !onlineMatchIds.has(session.sourceOnlineMatchId),
  )

  return {
    version: HISTORY_EXPORT_VERSION,
    ownerUserId: input.ownerUserId,
    sessions: practiceSessions,
    onlineMatches,
  }
}

export const loadAllCloudPracticeSessions = async (
  client: SupabaseClient,
): Promise<GameSession[]> => {
  const sessions: GameSession[] = []
  let from = 0

  for (;;) {
    const to = from + PRACTICE_SESSION_PAGE_SIZE - 1
    const { data, error } = await client.from('game_sessions').select('payload').range(from, to)

    if (error !== null) {
      throw error
    }

    const page: GameSession[] = []
    for (const row of data ?? []) {
      if (typeof row !== 'object' || row === null || !('payload' in row)) {
        continue
      }

      if (isGameSession(row.payload)) {
        page.push(row.payload)
      }
    }

    sessions.push(...page)

    if (page.length < PRACTICE_SESSION_PAGE_SIZE) {
      break
    }

    from += PRACTICE_SESSION_PAGE_SIZE
  }

  return sessions
}

export const collectHistoryExport = async (options: {
  ownerUserId: string | null
  viewerDisplayName?: string | null
  storage?: StorageAdapter
  client?: SupabaseClient | null
}): Promise<HistoryExportFile> => {
  const storage = options.storage ?? browserLocalStorage
  const client = options.client === undefined ? supabaseClient : options.client
  const localSessions = loadStoredSessions(storage)
  const ownerUserId = options.ownerUserId

  let cloudPracticeSessions: GameSession[] = []
  let onlineMatches: GameSession[] = []

  if (ownerUserId !== null && client !== null) {
    cloudPracticeSessions = await loadAllCloudPracticeSessions(client)
    const rows = await listAllMyOnlineMatchSessions(null)
    onlineMatches = rows.map((row) =>
      decorateOnlineSessionForViewer(
        { ...row.session, id: row.id },
        ownerUserId,
        options.viewerDisplayName,
      ),
    )
  }

  return buildHistoryExport({
    ownerUserId: options.ownerUserId,
    viewerDisplayName: options.viewerDisplayName,
    localSessions,
    cloudPracticeSessions,
    onlineMatches,
  })
}

export const downloadHistoryExport = (file: HistoryExportFile): void => {
  const payload = JSON.stringify(file, null, 2)
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = HISTORY_EXPORT_FILENAME
  anchor.click()
  URL.revokeObjectURL(url)
}
