import type { ActiveGameSnapshot } from '@open-dart/game/types/activeGameSnapshot'
import type { GameSession } from '@open-dart/game/types/gameSession'
import type { AppSettings } from '../../types/settings'
import {
  isActiveGameSnapshot,
  isGameSession,
  loadActiveSnapshot,
  loadStoredSessions,
  replaceStoredSessions,
  saveActiveSnapshot,
} from './gameStore'
import type { StorageAdapter } from './localStorageAdapter'
import { browserLocalStorage } from './localStorageAdapter'
import { parseAppSettings, saveSettings } from './settingsStore'
import { StorageKey } from './storageKeys'
import { HISTORY_EXPORT_VERSION } from './historyExport'

export const LOCAL_EXPORT_VERSION = 1
export const LOCAL_EXPORT_FILENAME = 'open-darts-export.json'

export interface LocalExportFile {
  version: typeof LOCAL_EXPORT_VERSION
  sessions: GameSession[]
  activeSession: ActiveGameSnapshot | null
  settings: AppSettings | null
  syncQueue: string[] | null
  syncDeleteQueue: string[] | null
  lastSyncAt: string | null
}

export interface HistoryImportFile {
  version: typeof HISTORY_EXPORT_VERSION
  ownerUserId: string | null
  sessions: GameSession[]
  onlineMatches: GameSession[]
}

export interface ImportLocalExportOptions {
  blockedOnlineMatchIds?: ReadonlySet<string> | readonly string[]
  createSessionId?: () => string
}

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const isIdList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')

const readIdList = (raw: string | null): string[] | null => {
  if (raw === null) {
    return null
  }

  const parsed = parseJson(raw)

  return isIdList(parsed) ? parsed : null
}

const isSessionList = (value: unknown): value is GameSession[] =>
  Array.isArray(value) && value.every((entry) => isGameSession(entry))

const isLastSyncAt = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))

const isSettingsValue = (value: unknown): value is AppSettings =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  parseAppSettings(value) !== null

const readSettings = (raw: string | null): AppSettings | null => {
  if (raw === null) {
    return null
  }

  return parseAppSettings(parseJson(raw))
}

export const buildLocalExport = (
  storage: StorageAdapter = browserLocalStorage,
): LocalExportFile => {
  const lastSyncAt = storage.getItem(StorageKey.LastSyncAt)

  return {
    version: LOCAL_EXPORT_VERSION,
    sessions: loadStoredSessions(storage),
    activeSession: loadActiveSnapshot(storage),
    settings: readSettings(storage.getItem(StorageKey.Settings)),
    syncQueue: readIdList(storage.getItem(StorageKey.SyncQueue)),
    syncDeleteQueue: readIdList(storage.getItem(StorageKey.SyncDeleteQueue)),
    lastSyncAt: lastSyncAt !== null && isLastSyncAt(lastSyncAt) ? lastSyncAt : null,
  }
}

const parseLocalExport = (raw: string): LocalExportFile | null => {
  const parsed = parseJson(raw)

  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }

  const file = parsed as Partial<LocalExportFile>

  if (file.version !== LOCAL_EXPORT_VERSION || !isSessionList(file.sessions)) {
    return null
  }

  if (file.activeSession !== null && !isActiveGameSnapshot(file.activeSession)) {
    return null
  }

  if (file.settings !== null && !isSettingsValue(file.settings)) {
    return null
  }

  if (file.syncQueue !== null && !isIdList(file.syncQueue)) {
    return null
  }

  if (file.syncDeleteQueue !== null && !isIdList(file.syncDeleteQueue)) {
    return null
  }

  if (file.lastSyncAt !== null && !isLastSyncAt(file.lastSyncAt)) {
    return null
  }

  if (
    file.activeSession === undefined ||
    file.settings === undefined ||
    file.syncQueue === undefined ||
    file.syncDeleteQueue === undefined ||
    file.lastSyncAt === undefined
  ) {
    return null
  }

  return {
    version: LOCAL_EXPORT_VERSION,
    sessions: file.sessions,
    activeSession: file.activeSession,
    settings: file.settings === null ? null : parseAppSettings(file.settings),
    syncQueue: file.syncQueue,
    syncDeleteQueue: file.syncDeleteQueue,
    lastSyncAt: file.lastSyncAt,
  }
}

const parseHistoryExport = (raw: string): HistoryImportFile | null => {
  const parsed = parseJson(raw)

  if (typeof parsed !== 'object' || parsed === null) {
    return null
  }

  const file = parsed as Partial<HistoryImportFile>

  if (file.version !== HISTORY_EXPORT_VERSION) {
    return null
  }

  if (file.ownerUserId !== null && typeof file.ownerUserId !== 'string') {
    return null
  }

  if (!isSessionList(file.sessions) || !isSessionList(file.onlineMatches)) {
    return null
  }

  return {
    version: HISTORY_EXPORT_VERSION,
    ownerUserId: file.ownerUserId ?? null,
    sessions: file.sessions,
    onlineMatches: file.onlineMatches,
  }
}

const writeIdList = (key: StorageKey, ids: string[] | null, storage: StorageAdapter): void => {
  if (ids === null) {
    return
  }

  if (ids.length === 0) {
    storage.removeItem(key)
    return
  }

  storage.setItem(key, JSON.stringify(ids))
}

const toBlockedMatchIdSet = (
  blockedOnlineMatchIds: ImportLocalExportOptions['blockedOnlineMatchIds'],
): Set<string> => {
  if (blockedOnlineMatchIds === undefined) {
    return new Set<string>()
  }

  if (blockedOnlineMatchIds instanceof Set) {
    return new Set<string>([...blockedOnlineMatchIds])
  }

  return new Set<string>(blockedOnlineMatchIds)
}

const matchIdAlreadyPresent = (
  matchId: string,
  sessions: readonly GameSession[],
  blockedOnlineMatchIds: ReadonlySet<string>,
  seenMatchIds: ReadonlySet<string>,
): boolean => {
  if (blockedOnlineMatchIds.has(matchId) || seenMatchIds.has(matchId)) {
    return true
  }

  return sessions.some(
    (session) => session.id === matchId || session.sourceOnlineMatchId === matchId,
  )
}

const convertOnlineMatchToLocalSession = (match: GameSession, sessionId: string): GameSession => ({
  ...match,
  id: sessionId,
  sourceOnlineMatchId: match.id,
})

const importHistoryExport = (
  file: HistoryImportFile,
  storage: StorageAdapter,
  options: ImportLocalExportOptions,
): boolean => {
  const blockedOnlineMatchIds = toBlockedMatchIdSet(options.blockedOnlineMatchIds)
  const createSessionId = options.createSessionId ?? (() => crypto.randomUUID())
  const existingSessions = loadStoredSessions(storage)
  const nextSessions = [...existingSessions]
  const seenMatchIds = new Set<string>()
  const storedIds = new Set(existingSessions.map((session) => session.id))

  for (const session of file.sessions) {
    if (session.sourceOnlineMatchId !== undefined) {
      if (
        matchIdAlreadyPresent(
          session.sourceOnlineMatchId,
          nextSessions,
          blockedOnlineMatchIds,
          seenMatchIds,
        )
      ) {
        continue
      }

      if (storedIds.has(session.id)) {
        continue
      }

      nextSessions.push(session)
      storedIds.add(session.id)
      seenMatchIds.add(session.sourceOnlineMatchId)
      continue
    }

    if (storedIds.has(session.id)) {
      continue
    }

    nextSessions.push(session)
    storedIds.add(session.id)
  }

  for (const match of file.onlineMatches) {
    if (matchIdAlreadyPresent(match.id, nextSessions, blockedOnlineMatchIds, seenMatchIds)) {
      continue
    }

    const localSession = convertOnlineMatchToLocalSession(match, createSessionId())
    nextSessions.push(localSession)
    storedIds.add(localSession.id)
    seenMatchIds.add(match.id)
  }

  if (nextSessions.length > 0) {
    replaceStoredSessions(nextSessions, storage)
  }

  return true
}

const importVersionOneExport = (file: LocalExportFile, storage: StorageAdapter): boolean => {
  const existingSessions = loadStoredSessions(storage)
  const incomingIds = new Set(file.sessions.map((session) => session.id))
  const mergedSessions = [
    ...existingSessions.filter((session) => !incomingIds.has(session.id)),
    ...file.sessions,
  ]

  if (mergedSessions.length > 0) {
    replaceStoredSessions(mergedSessions, storage)
  }

  if (file.activeSession !== null) {
    saveActiveSnapshot(file.activeSession, storage)
  }

  if (file.settings !== null) {
    saveSettings(file.settings, storage)
  }

  writeIdList(StorageKey.SyncQueue, file.syncQueue, storage)
  writeIdList(StorageKey.SyncDeleteQueue, file.syncDeleteQueue, storage)

  if (file.lastSyncAt !== null) {
    storage.setItem(StorageKey.LastSyncAt, file.lastSyncAt)
  }

  return true
}

export const importLocalExport = (
  raw: string,
  storage: StorageAdapter = browserLocalStorage,
  options: ImportLocalExportOptions = {},
): boolean => {
  const historyFile = parseHistoryExport(raw)
  if (historyFile !== null) {
    return importHistoryExport(historyFile, storage, options)
  }

  const file = parseLocalExport(raw)

  if (file === null) {
    return false
  }

  return importVersionOneExport(file, storage)
}
