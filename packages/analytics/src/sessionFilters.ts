import { GameStatus } from '@open-dart/game/types/gameMode.ts'
import type { GameSession } from '@open-dart/game/types/gameSession.ts'
import { getSessionCompletedAt } from './sessionLabels.ts'

export type DateRangePreset = 'all' | '7d' | '30d'

export interface AnalyticsFilter {
  dateRange: DateRangePreset
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Absolute "now minus N days" cutoff as an ISO instant.
 * Shared by client session filters and online fetch windows so boundary
 * sessions cannot be included under one calendar rule and dropped under another.
 */
export const getDateRangeCutoff = (
  dateRange: DateRangePreset,
  now: Date = new Date(),
): string | null => {
  if (dateRange === 'all') {
    return null
  }

  const days = dateRange === '7d' ? 7 : 30

  return new Date(now.getTime() - days * MS_PER_DAY).toISOString()
}

export const filterSessions = (sessions: GameSession[], filter: AnalyticsFilter): GameSession[] => {
  const cutoff = getDateRangeCutoff(filter.dateRange)

  return sessions.filter((session) => {
    if (session.status !== GameStatus.Completed) {
      return false
    }

    if (cutoff !== null && getSessionCompletedAt(session) < cutoff) {
      return false
    }

    return true
  })
}
