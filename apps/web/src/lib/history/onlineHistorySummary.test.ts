import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import { MatchEndingKind, MatchStatus, PlayMode } from '../matchServer/types'
import type { OnlineMatchHistoryRow } from '../matchServer/types'
import { formatSessionDate } from './sessionSummary'
import {
  getOnlineMatchEndingLabel,
  getOnlineMatchModeLabel,
  getOnlineMatchResultSummary,
  getOnlineMatchSummaryHeader,
  getOnlineMatchSummaryTitle,
  readOnlineMatchHistorySession,
} from './onlineHistorySummary'

const sampleMatch = (overrides: Partial<OnlineMatchHistoryRow> = {}): OnlineMatchHistoryRow => ({
  id: 'match-1',
  status: MatchStatus.Completed,
  playMode: PlayMode.Synchronous,
  mode: GameModeId.X01,
  x01StartScore: 501,
  claimTheBoardAimMode: null,
  legsToWin: 3,
  endingKind: MatchEndingKind.Checkout,
  winnerUserId: 'viewer',
  winnerSlot: 0,
  creatorUserId: 'viewer',
  completedAt: '2026-09-08T12:00:00.000Z',
  createdAt: '2026-09-08T11:00:00.000Z',
  playerUserIds: ['viewer', 'opponent'],
  playerDisplayNames: ['Viewer', 'Alex'],
  opponentUserId: 'opponent',
  opponentDisplayName: 'Alex',
  resultLabel: '2:1',
  scorecardVersion: 1,
  session: null,
  ...overrides,
})

describe('onlineHistorySummary', () => {
  it('labels X01 matches by start score', () => {
    expect(getOnlineMatchModeLabel(sampleMatch())).toBe('501')
  })

  it('labels ending kinds for history display', () => {
    expect(getOnlineMatchEndingLabel(MatchEndingKind.Checkout)).toBe('Checkout')
    expect(getOnlineMatchEndingLabel(MatchEndingKind.Abandon)).toBe('Abandon')
    expect(getOnlineMatchEndingLabel(MatchEndingKind.AsyncTimeout)).toBe('Async timeout')
    expect(getOnlineMatchEndingLabel(MatchEndingKind.MutualCancel)).toBe('Mutual cancel')
    expect(getOnlineMatchEndingLabel(MatchEndingKind.AsyncResult)).toBe('Async result')
    expect(getOnlineMatchEndingLabel(MatchEndingKind.IdleTimeout)).toBe('Timed out')
  })

  it('summarizes wins, losses, and mutual cancels for the viewer', () => {
    expect(getOnlineMatchResultSummary(sampleMatch(), 'viewer', 'Alex')).toBe(
      'Won vs Alex · Checkout · 3 legs',
    )
    expect(
      getOnlineMatchResultSummary(
        sampleMatch({ winnerUserId: 'opponent', endingKind: MatchEndingKind.Abandon }),
        'viewer',
        'Alex',
      ),
    ).toBe('Lost vs Alex · Abandon · 3 legs')
    expect(
      getOnlineMatchResultSummary(
        sampleMatch({
          status: MatchStatus.Cancelled,
          endingKind: MatchEndingKind.MutualCancel,
          winnerUserId: null,
        }),
        'viewer',
        'Alex',
      ),
    ).toBe('Draw vs Alex · Mutual cancel · 3 legs')
  })

  it('titles online match summaries for the viewer', () => {
    expect(getOnlineMatchSummaryTitle(sampleMatch(), 'viewer')).toBe('Match won!')
    expect(getOnlineMatchSummaryTitle(sampleMatch({ winnerUserId: 'opponent' }), 'viewer')).toBe(
      'Match lost',
    )
    expect(
      getOnlineMatchSummaryTitle(
        sampleMatch({
          endingKind: MatchEndingKind.MutualCancel,
          winnerUserId: null,
          winnerSlot: null,
        }),
        'viewer',
      ),
    ).toBe('Draw')
    expect(
      getOnlineMatchSummaryTitle(
        sampleMatch({
          winnerUserId: null,
          winnerSlot: 0,
          playerUserIds: ['viewer', null],
          opponentUserId: null,
          opponentDisplayName: 'Deleted player',
        }),
        'viewer',
      ),
    ).toBe('Match won!')
    expect(
      getOnlineMatchSummaryTitle(
        sampleMatch({
          winnerUserId: null,
          winnerSlot: 1,
          playerUserIds: ['viewer', null],
          opponentUserId: null,
          opponentDisplayName: 'Deleted player',
        }),
        'viewer',
      ),
    ).toBe('Match lost')
  })

  it('builds an online match summary header from format, time, and result', () => {
    expect(getOnlineMatchSummaryHeader(sampleMatch())).toEqual({
      modeLabel: '501',
      completedAtLabel: formatSessionDate('2026-09-08T12:00:00.000Z'),
      resultLabel: '2:1',
    })
    expect(getOnlineMatchSummaryHeader(sampleMatch({ resultLabel: null }))).toEqual({
      modeLabel: '501',
      completedAtLabel: formatSessionDate('2026-09-08T12:00:00.000Z'),
      resultLabel: null,
    })
  })

  it('reads a stored game session from result_payload', () => {
    const session = {
      id: 'session-1',
      mode: GameModeId.X01,
      config: { startScore: 501, doubleIn: false, doubleOut: true },
      players: [],
      visits: [],
      status: GameStatus.Completed,
      startedAt: '2026-09-08T11:00:00.000Z',
    }

    expect(readOnlineMatchHistorySession({ session, winnerUserId: 'viewer' })).toEqual(session)
    expect(
      readOnlineMatchHistorySession(JSON.stringify({ session, winnerUserId: 'viewer' })),
    ).toEqual(session)
    expect(readOnlineMatchHistorySession({ asyncPlay: {}, visits: [] })).toBeNull()
    expect(readOnlineMatchHistorySession(null)).toBeNull()
  })
})
