import type { GameSession } from '@open-dart/game/types/gameSession'

/** Drop imported match copies when the live online match is already loaded. */
export const excludeMirroredOnlineMatchCopies = (
  sessions: readonly GameSession[],
  onlineMatchIds: ReadonlySet<string>,
): GameSession[] =>
  sessions.filter(
    (session) =>
      session.sourceOnlineMatchId === undefined || !onlineMatchIds.has(session.sourceOnlineMatchId),
  )
