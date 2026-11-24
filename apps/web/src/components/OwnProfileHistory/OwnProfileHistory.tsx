import { Button, Stack } from '@chakra-ui/react'
import { useCallback, useMemo, useState } from 'react'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { useAuth } from '../../hooks/authContext'
import { getLocalHistorySessions } from '../../lib/history/localHistorySessions'
import { isOnlineMatchesEnabled } from '../../lib/matchServer/config'
import type { OnlineMatchHistoryRow } from '../../lib/matchServer/types'
import {
  clearStoredSessions,
  loadStoredSessions,
  removeStoredSession,
} from '../../lib/storage/gameStore'
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
  /** Called after a delete or reset so profile stats reload from storage. */
  onStoredSessionsChange: () => void
}

export const OwnProfileHistory = ({
  storedSessions,
  onStoredSessionsChange,
}: OwnProfileHistoryProps) => {
  const { user, profile, authStatus, clearSyncedSessions } = useAuth()
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null)
  const [selectedOnlineMatch, setSelectedOnlineMatch] = useState<OnlineMatchHistoryRow | null>(null)
  const [sessionPendingDelete, setSessionPendingDelete] = useState<GameSession | null>(null)
  const [isDeletingSession, setIsDeletingSession] = useState(false)
  const [deleteSessionError, setDeleteSessionError] = useState<string | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  const isSignedIn = authStatus === AuthStatus.Authenticated && user !== null
  const showOnlineHistory = isSignedIn && isOnlineMatchesEnabled
  const localSessions = useMemo(
    () => getLocalHistorySessions(storedSessions, showOnlineHistory),
    [showOnlineHistory, storedSessions],
  )

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
        {storedSessions.length > 0 ? (
          <Button
            variant="destructive"
            alignSelf="start"
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
