import { Heading, Stack } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { HISTORY_PAGE_SIZE, takeHistoryPage } from '../../lib/history/historyPager'
import { HistoryEntrySource } from '../../lib/history/onlineHistorySummary'
import { sortSessionsByDate } from '../../lib/history/sessionSummary'
import { HistoryList } from '../HistoryList/HistoryList'
import type { HistoryListEntry } from '../HistoryList/HistoryList'

export interface LocalHistorySectionProps {
  sessions: GameSession[]
  onSelectSession: (session: GameSession) => void
  onDeleteSession: (session: GameSession) => void
}

export const LocalHistorySection = ({
  sessions,
  onSelectSession,
  onDeleteSession,
}: LocalHistorySectionProps) => {
  const [visibleCount, setVisibleCount] = useState(HISTORY_PAGE_SIZE)

  const entries = useMemo(
    (): HistoryListEntry[] =>
      sortSessionsByDate(sessions).map((session) => ({
        source: HistoryEntrySource.Local,
        id: session.id,
        sortAt: session.completedAt ?? session.startedAt,
        session,
      })),
    [sessions],
  )
  const page = useMemo(() => takeHistoryPage(entries, visibleCount), [entries, visibleCount])

  return (
    <Stack as="section" aria-label="History" gap={4}>
      <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
        History
      </Heading>
      <HistoryList
        entries={page.entries}
        hasMore={page.hasMore}
        onLoadMore={() => {
          setVisibleCount((current) => current + HISTORY_PAGE_SIZE)
        }}
        onSelectSession={onSelectSession}
        onSelectOnlineMatch={() => undefined}
        onDeleteSession={onDeleteSession}
      />
    </Stack>
  )
}
