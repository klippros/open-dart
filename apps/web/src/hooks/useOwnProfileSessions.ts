import { useCallback, useEffect, useMemo, useState } from 'react'
import { computeAnalytics } from '@open-dart/analytics/computeAnalytics'
import type { AnalyticsResult } from '@open-dart/analytics/computeAnalytics'
import { filterSessions, getDateRangeCutoff } from '@open-dart/analytics/sessionFilters'
import type { DateRangePreset } from '@open-dart/analytics/sessionFilters'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { excludeMirroredOnlineMatchCopies } from '../lib/analytics/excludeMirroredOnlineMatchCopies'
import { mergeSessionsForStats } from '../lib/analytics/mergeSessionsForStats'
import { listMyOnlineMatchSessions } from '../lib/matchServer/api'
import { isOnlineMatchesEnabled } from '../lib/matchServer/config'
import { decorateOnlineSessionForViewer } from '../lib/matchServer/onlinePlay'
import { loadStoredSessions } from '../lib/storage/gameStore'
import { AuthStatus, SyncStatus } from '../types/auth'
import { useAuth } from './authContext'

export interface OwnProfileSessions {
  storedSessions: GameSession[]
  onlineMatchIds: ReadonlySet<string>
  allSessions: GameSession[]
  filteredSessions: GameSession[]
  analytics: AnalyticsResult
  reloadStoredSessions: () => void
}

/**
 * Local sessions plus the viewer's online match sessions for the selected
 * range. Online rows are fetched with the same cutoff helper the client
 * filter uses, so boundary games are treated the same way on both sides.
 */
export const useOwnProfileSessions = (dateRange: DateRangePreset): OwnProfileSessions => {
  const { authStatus, syncStatus, user, profile } = useAuth()
  const [storedSessions, setStoredSessions] = useState(() => loadStoredSessions())
  const [onlineSessions, setOnlineSessions] = useState<GameSession[]>([])

  const isSignedIn = authStatus === AuthStatus.Authenticated && user !== null
  const shouldLoadOnline = isSignedIn && isOnlineMatchesEnabled
  const viewerUserId = user?.id ?? null
  const viewerDisplayName = profile?.displayName

  const reloadStoredSessions = useCallback(() => {
    setStoredSessions(loadStoredSessions())
  }, [])

  useEffect(() => {
    if (authStatus === AuthStatus.Anonymous || authStatus === AuthStatus.Authenticated) {
      reloadStoredSessions()
    }
  }, [authStatus, reloadStoredSessions])

  useEffect(() => {
    if (syncStatus === SyncStatus.Synced) {
      reloadStoredSessions()
    }
  }, [reloadStoredSessions, syncStatus])

  useEffect(() => {
    if (!shouldLoadOnline || viewerUserId === null) {
      setOnlineSessions([])
      return undefined
    }

    let cancelled = false

    const load = async () => {
      try {
        const sessions = await listMyOnlineMatchSessions(
          viewerUserId,
          getDateRangeCutoff(dateRange),
        )
        if (!cancelled) {
          setOnlineSessions(
            sessions.map((session) =>
              decorateOnlineSessionForViewer(session, viewerUserId, viewerDisplayName),
            ),
          )
        }
      } catch {
        if (!cancelled) {
          setOnlineSessions([])
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [dateRange, shouldLoadOnline, viewerDisplayName, viewerUserId])

  const onlineMatchIds = useMemo(
    () => new Set(onlineSessions.map((session) => session.id)),
    [onlineSessions],
  )
  const allSessions = useMemo(
    () =>
      mergeSessionsForStats(
        excludeMirroredOnlineMatchCopies(storedSessions, onlineMatchIds),
        onlineSessions,
      ),
    [onlineMatchIds, onlineSessions, storedSessions],
  )
  const filteredSessions = useMemo(
    () => filterSessions(allSessions, { dateRange }),
    [allSessions, dateRange],
  )
  const analytics = useMemo(
    () => computeAnalytics(allSessions, { dateRange }),
    [allSessions, dateRange],
  )

  return {
    storedSessions,
    onlineMatchIds,
    allSessions,
    filteredSessions,
    analytics,
    reloadStoredSessions,
  }
}
