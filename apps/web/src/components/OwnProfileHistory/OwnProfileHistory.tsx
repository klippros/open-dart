import { Button, Stack, Text } from '@chakra-ui/react'
import { useCallback, useMemo, useState } from 'react'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { useAuth } from '../../hooks/authContext'
import { excludeMirroredOnlineMatchCopies } from '../../lib/analytics/excludeMirroredOnlineMatchCopies'
import { getLocalHistorySessions } from '../../lib/history/localHistorySessions'
import { isOnlineMatchesEnabled } from '../../lib/matchServer/config'
import type { OnlineMatchHistoryRow } from '../../lib/matchServer/types'
import {
  clearStoredSessions,
  loadStoredSessions,
  removeStoredSession,
} from '../../lib/storage/gameStore'
import { collectHistoryExport, downloadHistoryExport } from '../../lib/storage/historyExport'
import { deleteSyncedSessionAndRefresh, isSessionSyncActive } from '../../lib/sync/sessionSync'
import { AuthStatus } from '../../types/auth'
import { DeleteSessionDialog } from '../DeleteSessionDialog/DeleteSessionDialog'
import { OnlineMatchSummaryDialog } from '../MatchSummaryDialog/OnlineMatchSummaryDialog'
import { SessionSummaryDialog } from '../MatchSummaryDialog/SessionSummaryDialog'
import { ResetStatsDialog } from '../ResetStatsDialog/ResetStatsDialog'
import { LocalHistorySection } from './LocalHistorySection'
import { OnlineHistorySection } from './OnlineHistorySection'

export interface OwnProfileHistoryProps {
  storedSessions: GameSession[]
  /** Online match ids already loaded for stats; used to hide imported copies. */
  onlineMatchIds?: ReadonlySet<string>
  /** Called after a delete or reset so profile stats reload from storage. */
  onStoredSessionsChange: () => void
}

export const OwnProfileHistory = ({
  storedSessions,
  onlineMatchIds = new Set(),
  onStoredSessionsChange,
}: OwnProfileHistoryProps) => {
  const { user, profile, authStatus, clearSyncedSessions } = useAuth()
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null)
  const [selectedOnlineMatch, setSelectedOnlineMatch] = useState<OnlineMatchHistoryRow | null>(null)
  const [sessionPendingDelete, setSessionPendingDelete] = useState<GameSession | null>(null)
  const [isDeletingSession, setIsDeletingSession] = useState(false)
  const [deleteSessionError, setDeleteSessionError] = useState<string | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const isSignedIn = authStatus === AuthStatus.Authenticated && user !== null
  const showOnlineHistory = isSignedIn && isOnlineMatchesEnabled
  const localSessions = useMemo(
    () =>
      getLocalHistorySessions(
        excludeMirroredOnlineMatchCopies(storedSessions, onlineMatchIds),
        showOnlineHistory,
      ),
    [onlineMatchIds, showOnlineHistory, storedSessions],
  )
  const showExportButton = isSignedIn || storedSessions.length > 0

  const openSession = useCallback((session: GameSession) => {
    setSelectedOnlineMatch(null)
    setSelectedSession(session)
  }, [])

  const openOnlineMatch = useCallback((match: OnlineMatchHistoryRow) => {
    setSelectedSession(null)
    setSelectedOnlineMatch(match)
  }, [])

  const handleRequestDeleteSession = useCallback((session: GameSession) => {
    const current = loadStoredSessions().find((entry) => entry.id === session.id)
    if (current === undefined) {
      return
    }

    setDeleteSessionError(null)
    setSessionPendingDelete(current)
  }, [])

  const handleConfirmDeleteSession = useCallback(async () => {
    const pending = sessionPendingDelete
    if (pending === null || isDeletingSession) {
      return
    }

    const current = loadStoredSessions().find((entry) => entry.id === pending.id)
    if (current === undefined) {
      setSessionPendingDelete(null)
      return
    }

    setIsDeletingSession(true)
    setDeleteSessionError(null)

    try {
      if (isSessionSyncActive()) {
        const result = await deleteSyncedSessionAndRefresh(current.id)
        if (!result.ok) {
          setDeleteSessionError(result.error)
          return
        }
      } else {
        removeStoredSession(current.id)
      }

      onStoredSessionsChange()
      setSelectedSession((selected) => (selected?.id === current.id ? null : selected))
      setSessionPendingDelete(null)
    } finally {
      setIsDeletingSession(false)
    }
  }, [isDeletingSession, onStoredSessionsChange, sessionPendingDelete])

  const handleResetConfirm = useCallback(async () => {
    const clearError = await clearSyncedSessions()
    if (clearError !== null) {
      return
    }

    clearStoredSessions()
    onStoredSessionsChange()
    setResetDialogOpen(false)
  }, [clearSyncedSessions, onStoredSessionsChange])

  const handleExportHistory = useCallback(async () => {
    if (isExporting) {
      return
    }

    setIsExporting(true)
    setExportError(null)

    try {
      const file = await collectHistoryExport({
        ownerUserId: user?.id ?? null,
        viewerDisplayName: profile?.displayName,
      })
      downloadHistoryExport(file)
    } catch {
      setExportError('Could not export history.')
    } finally {
      setIsExporting(false)
    }
  }, [isExporting, profile?.displayName, user?.id])

  return (
    <>
      <Stack gap={8}>
        {showOnlineHistory ? (
          <OnlineHistorySection
            viewerUserId={user.id}
            viewerDisplayName={profile?.displayName}
            onOpenSession={openSession}
            onOpenMatch={openOnlineMatch}
          />
        ) : null}
        <LocalHistorySection
          sessions={localSessions}
          onSelectSession={openSession}
          onDeleteSession={handleRequestDeleteSession}
        />
        {showExportButton ? (
          <Stack gap={2}>
            <Button
              variant="cta"
              w="full"
              disabled={isExporting}
              onClick={() => {
                void handleExportHistory()
              }}
            >
              {isExporting ? 'Exporting…' : 'Export history'}
            </Button>
            {exportError !== null ? (
              <Text fontSize="sm" color="red.300">
                {exportError}
              </Text>
            ) : null}
          </Stack>
        ) : null}
        {storedSessions.length > 0 ? (
          <Button
            variant="destructive"
            w="full"
            onClick={() => {
              setResetDialogOpen(true)
            }}
          >
            Reset history and stats
          </Button>
        ) : null}
      </Stack>
      <SessionSummaryDialog
        open={selectedSession !== null}
        session={selectedSession}
        onClose={() => {
          setSelectedSession(null)
        }}
      />
      <OnlineMatchSummaryDialog
        open={selectedOnlineMatch !== null}
        match={selectedOnlineMatch}
        onClose={() => {
          setSelectedOnlineMatch(null)
        }}
      />
      <DeleteSessionDialog
        open={sessionPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingSession) {
            setSessionPendingDelete(null)
            setDeleteSessionError(null)
          }
        }}
        onConfirm={() => {
          void handleConfirmDeleteSession()
        }}
        isDeleting={isDeletingSession}
        errorMessage={deleteSessionError}
      />
      <ResetStatsDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onConfirm={() => {
          void handleResetConfirm()
        }}
        isSignedIn={isSignedIn}
      />
    </>
  )
}
