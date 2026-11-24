import { isOnlineSession } from '@open-dart/analytics/sessionScope'
import type { GameSession } from '@open-dart/game/types/gameSession'

/**
 * Sessions for the local History list. Online matches saved on this device
 * already appear under Online history, so they are left out while that list
 * is shown.
 */
export const getLocalHistorySessions = (
  storedSessions: readonly GameSession[],
  onlineHistoryShown: boolean,
): GameSession[] =>
  onlineHistoryShown
    ? storedSessions.filter((session) => !isOnlineSession(session))
    : [...storedSessions]
