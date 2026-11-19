import { Box, Button, Stack, Text } from '@chakra-ui/react'
import type { GameSession } from '@open-dart/game/types/gameSession'
import type { OnlineMatchSummary } from '../../lib/matchServer/types'
import { getMatchSummaryHeader } from '../../lib/history/sessionSummary'
import {
  getOnlineMatchSummaryHeader,
  HistoryEntrySource,
} from '../../lib/history/onlineHistorySummary'
import { HistoryListItem } from './HistoryListItem'

export type HistoryListEntry =
  | {
      source: HistoryEntrySource.Local
      id: string
      sortAt: string
      session: GameSession
    }
  | {
      source: HistoryEntrySource.Online
      id: string
      sortAt: string
      match: OnlineMatchSummary
      canOpenDetail: boolean
    }

export interface HistoryListProps {
  entries: HistoryListEntry[]
  hasMore?: boolean
  onLoadMore?: () => void
  onSelectSession: (session: GameSession) => void
  onSelectOnlineMatch: (match: OnlineMatchSummary) => void
}

export const HistoryList = ({
  entries,
  hasMore = false,
  onLoadMore,
  onSelectSession,
  onSelectOnlineMatch,
}: HistoryListProps) => {
  if (entries.length === 0) {
    return (
      <Box
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        borderRadius="lg"
        bg="whiteAlpha.50"
        px={5}
        py={6}
      >
        <Text color="whiteAlpha.700" fontSize="sm" lineHeight="1.65">
          No completed games yet. Finish a match and it will show up here.
        </Text>
      </Box>
    )
  }

  return (
    <Stack gap={3}>
      {entries.map((entry) => {
        if (entry.source === HistoryEntrySource.Local) {
          return (
            <HistoryListItem
              key={`local:${entry.id}`}
              header={getMatchSummaryHeader(entry.session)}
              onClick={() => {
                onSelectSession(entry.session)
              }}
            />
          )
        }

        const opponentUserId = entry.match.opponentUserId
        const opponentName = entry.match.opponentDisplayName ?? undefined

        return (
          <HistoryListItem
            key={`online:${entry.id}`}
            header={getOnlineMatchSummaryHeader(entry.match)}
            badgeLabel="Online"
            opponentProfileTo={opponentUserId === null ? undefined : `/players/${opponentUserId}`}
            opponentName={opponentName}
            onClick={
              entry.canOpenDetail
                ? () => {
                    onSelectOnlineMatch(entry.match)
                  }
                : undefined
            }
          />
        )
      })}
      {hasMore && onLoadMore !== undefined ? (
        <Button variant="cancel" onClick={onLoadMore}>
          More
        </Button>
      ) : null}
    </Stack>
  )
}
