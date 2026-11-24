import { Heading, Stack } from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { resolveHumanPlayerName } from '@open-dart/game/game/playerFactory'
import { HISTORY_PAGE_SIZE } from '../../lib/history/historyPager'
import {
  getOnlineMatchCompletedAt,
  HistoryEntrySource,
} from '../../lib/history/onlineHistorySummary'
import { getMyOnlineMatchDetail, listMyOnlineMatchSummaries } from '../../lib/matchServer/api'
import { decorateOnlineSessionForViewer } from '../../lib/matchServer/onlinePlay'
import type { OnlineMatchHistoryRow, OnlineMatchSummary } from '../../lib/matchServer/types'
import { HistoryList } from '../HistoryList/HistoryList'
import type { HistoryListEntry } from '../HistoryList/HistoryList'

export interface OnlineHistorySectionProps {
  viewerUserId: string
  viewerDisplayName: string | undefined
  onOpenSession: (session: GameSession) => void
  onOpenMatch: (match: OnlineMatchHistoryRow) => void
}

export const OnlineHistorySection = ({
  viewerUserId,
  viewerDisplayName,
  onOpenSession,
  onOpenMatch,
}: OnlineHistorySectionProps) => {
  const [matches, setMatches] = useState<OnlineMatchSummary[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const firstPage = await listMyOnlineMatchSummaries(viewerUserId, {
          limit: HISTORY_PAGE_SIZE,
        })
        if (!cancelled) {
          setMatches(firstPage)
          setHasMore(firstPage.length === HISTORY_PAGE_SIZE)
        }
      } catch {
        if (!cancelled) {
          setMatches([])
          setHasMore(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [viewerUserId])

  const handleLoadMore = useCallback(async () => {
    const last = matches.at(-1)
    if (loadingMore || !hasMore || last === undefined) {
      return
    }

    setLoadingMore(true)
    try {
      const more = await listMyOnlineMatchSummaries(viewerUserId, {
        beforeCompletedAt: getOnlineMatchCompletedAt(last),
        beforeId: last.id,
        limit: HISTORY_PAGE_SIZE,
      })
      setMatches((current) => {
        const known = new Set(current.map((match) => match.id))
        return [...current, ...more.filter((match) => !known.has(match.id))]
      })
      setHasMore(more.length === HISTORY_PAGE_SIZE)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, matches, viewerUserId])

  const handleSelectMatch = useCallback(
    async (match: OnlineMatchSummary) => {
      try {
        const detail = await getMyOnlineMatchDetail(viewerUserId, match.id)
        if (detail?.session !== null && detail?.session !== undefined) {
          const opponentName = resolveHumanPlayerName(
            detail.opponentDisplayName ?? match.opponentDisplayName,
          )
          onOpenSession(
            decorateOnlineSessionForViewer(
              detail.session,
              viewerUserId,
              viewerDisplayName,
              opponentName,
            ),
          )
          return
        }

        onOpenMatch({
          ...(detail ?? { ...match, scorecardVersion: 1, session: null }),
          resultLabel: match.resultLabel,
        })
      } catch {
        onOpenMatch({ ...match, scorecardVersion: 1, session: null })
      }
    },
    [onOpenMatch, onOpenSession, viewerDisplayName, viewerUserId],
  )

  const entries = useMemo(
    (): HistoryListEntry[] =>
      matches.map((match) => ({
        source: HistoryEntrySource.Online as const,
        id: match.id,
        sortAt: getOnlineMatchCompletedAt(match),
        match,
        canOpenDetail: true,
      })),
    [matches],
  )

  return (
    <Stack as="section" aria-label="Online history" gap={4}>
      <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
        Online history
      </Heading>
      <HistoryList
        entries={entries}
        hasMore={hasMore}
        onLoadMore={() => {
          void handleLoadMore()
        }}
        onSelectSession={onOpenSession}
        onSelectOnlineMatch={(match) => {
          void handleSelectMatch(match)
        }}
        emptyMessage="No online matches yet."
      />
    </Stack>
  )
}
