import { formatX01StartScore } from '@open-dart/game/x01/x01Presets'
import {
  getAroundTheClockAimModeLabel,
  parseAroundTheClockAimModeValue,
} from '@open-dart/game/aroundTheClock/aroundTheClockConfig'
import { parseGameSession } from '@open-dart/game/game/serializeGame'
import { GameModeId } from '@open-dart/game/types/gameMode'
import { gameModeDefinitions } from '@open-dart/game/game/gameModeDefinitions'
import type { GameSession } from '@open-dart/game/types/gameSession'
import type { OnlineMatchSummary } from '../matchServer/types'
import { MatchEndingKind } from '../matchServer/types'
import { formatSessionDate } from './sessionSummary'
import type { MatchSummaryHeader } from './sessionSummary'

export enum HistoryEntrySource {
  Local = 'local',
  Online = 'online',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const readOnlineMatchHistorySession = (resultPayload: unknown): GameSession | null => {
  let payload: unknown = resultPayload

  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      return null
    }
  }

  if (!isRecord(payload) || !('session' in payload)) {
    return null
  }

  try {
    return parseGameSession(JSON.stringify(payload.session))
  } catch {
    return null
  }
}

export const getOnlineMatchModeLabel = (match: OnlineMatchSummary): string => {
  if (match.mode === GameModeId.X01 && match.x01StartScore !== null) {
    return formatX01StartScore({
      startScore: match.x01StartScore,
      doubleIn: false,
      doubleOut: true,
    })
  }

  if (match.mode === GameModeId.ClaimTheBoard && match.claimTheBoardAimMode !== null) {
    const aimMode = parseAroundTheClockAimModeValue(match.claimTheBoardAimMode)
    if (aimMode !== null) {
      return `${gameModeDefinitions[match.mode].label} · ${getAroundTheClockAimModeLabel(aimMode)}`
    }
  }

  return gameModeDefinitions[match.mode]?.label ?? match.mode
}

export const getOnlineMatchEndingLabel = (endingKind: MatchEndingKind): string => {
  switch (endingKind) {
    case MatchEndingKind.Checkout:
      return 'Checkout'
    case MatchEndingKind.Abandon:
      return 'Abandon'
    case MatchEndingKind.AsyncTimeout:
      return 'Async timeout'
    case MatchEndingKind.MutualCancel:
      return 'Mutual cancel'
    case MatchEndingKind.AsyncResult:
      return 'Async result'
    case MatchEndingKind.LobbyTimeout:
      return 'Lobby timeout'
    case MatchEndingKind.CreatorCancel:
      return 'Cancelled'
    case MatchEndingKind.IdleTimeout:
      return 'Timed out'
    default: {
      const _exhaustive: never = endingKind
      return _exhaustive
    }
  }
}

const viewerWonOnlineMatch = (match: OnlineMatchSummary, viewerUserId: string): boolean => {
  if (match.winnerUserId === viewerUserId) {
    return true
  }

  if (match.winnerUserId !== null || match.winnerSlot === null) {
    return false
  }

  const viewerSlot = match.playerUserIds.findIndex((id) => id === viewerUserId)
  return viewerSlot === match.winnerSlot
}

const onlineMatchHasWinner = (match: OnlineMatchSummary): boolean =>
  match.winnerUserId !== null || match.winnerSlot !== null

export const getOnlineMatchSummaryTitle = (
  match: OnlineMatchSummary,
  viewerUserId: string,
): string => {
  if (
    match.endingKind === MatchEndingKind.MutualCancel ||
    match.endingKind === MatchEndingKind.IdleTimeout ||
    !onlineMatchHasWinner(match)
  ) {
    return 'Draw'
  }

  if (viewerWonOnlineMatch(match, viewerUserId)) {
    return 'Match won!'
  }

  return 'Match lost'
}

export const getOnlineMatchResultSummary = (
  match: OnlineMatchSummary,
  viewerUserId: string,
  opponentName: string,
): string => {
  const endingLabel = getOnlineMatchEndingLabel(match.endingKind)
  const legsLabel = `${match.legsToWin} leg${match.legsToWin === 1 ? '' : 's'}`

  if (
    match.endingKind === MatchEndingKind.MutualCancel ||
    match.endingKind === MatchEndingKind.IdleTimeout ||
    !onlineMatchHasWinner(match)
  ) {
    return `Draw vs ${opponentName} · ${endingLabel} · ${legsLabel}`
  }

  if (viewerWonOnlineMatch(match, viewerUserId)) {
    return `Won vs ${opponentName} · ${endingLabel} · ${legsLabel}`
  }

  return `Lost vs ${opponentName} · ${endingLabel} · ${legsLabel}`
}

export const getOnlineMatchCompletedAt = (match: OnlineMatchSummary): string =>
  match.completedAt ?? match.createdAt

export const formatOnlineMatchDate = (match: OnlineMatchSummary): string =>
  formatSessionDate(getOnlineMatchCompletedAt(match))

export const getOnlineMatchSummaryHeader = (match: OnlineMatchSummary): MatchSummaryHeader => ({
  modeLabel: getOnlineMatchModeLabel(match),
  completedAtLabel: formatOnlineMatchDate(match),
  resultLabel: match.resultLabel,
})
