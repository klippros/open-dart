import { describe, expect, it } from 'vitest'
import { AroundTheClockAimMode } from '@open-dart/game/types/aroundTheClock'
import { ChallengeLegEndMode } from '@open-dart/game/types/match'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import {
  formatSessionDate,
  getMatchResultLabel,
  getMatchSummary,
  getMatchSummaryHeader,
  getSessionModeLabel,
  getSessionResultSummary,
  sortSessionsByDate,
} from './sessionSummary'

const sampleSession = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  mode: GameModeId.X01,
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [{ id: 'player-1', name: 'You', kind: PlayerKind.Human }],
  visits: [
    {
      visitIndex: 0,
      playerId: 'player-1',
      darts: [],
      visitScore: 60,
      scoreBefore: 501,
      scoreAfter: 441,
      bust: false,
      checkout: false,
    },
    {
      visitIndex: 1,
      playerId: 'player-1',
      darts: [],
      visitScore: 40,
      scoreBefore: 441,
      scoreAfter: 401,
      bust: false,
      checkout: false,
    },
  ],
  status: GameStatus.Completed,
  startedAt: '2026-01-01T10:00:00.000Z',
  completedAt: '2026-01-01T10:15:00.000Z',
  ...overrides,
})

describe('sessionSummary', () => {
  it('labels x01 sessions by start score and other modes by definition label', () => {
    expect(getSessionModeLabel(sampleSession())).toBe('501')
    expect(
      getSessionModeLabel(
        sampleSession({
          mode: GameModeId.Bob27,
          config: { startScore: 27 },
        }),
      ),
    ).toBe("Bob's 27")
    expect(
      getSessionModeLabel(
        sampleSession({
          mode: GameModeId.AroundTheClock,
          config: { finishOnBull: true, aimMode: AroundTheClockAimMode.Singles },
        }),
      ),
    ).toBe('Around the Clock · Singles')
  })

  it('summarizes x01 sessions without visit stats in the text summary', () => {
    expect(getSessionResultSummary(sampleSession())).toBe('')
  })

  it('builds match summaries for completed games', () => {
    expect(getMatchSummary(sampleSession())).toEqual({
      title: 'Session complete',
      details: [],
    })
  })

  it('puts Around the Clock aim mode in the match summary title', () => {
    expect(
      getMatchSummary(
        sampleSession({
          mode: GameModeId.AroundTheClock,
          config: { finishOnBull: true, aimMode: AroundTheClockAimMode.Doubles },
          visits: [],
        }),
      ).title,
    ).toBe('Around the Clock · Doubles complete')
  })

  it('uses the checkout visit score before the winning visit', () => {
    expect(
      getMatchSummary(
        sampleSession({
          config: { startScore: 301, doubleIn: false, doubleOut: true },
          visits: [
            {
              visitIndex: 0,
              playerId: 'player-1',
              darts: [],
              visitScore: 100,
              scoreBefore: 301,
              scoreAfter: 201,
              bust: false,
              checkout: false,
            },
            {
              visitIndex: 1,
              playerId: 'player-1',
              darts: [],
              visitScore: 50,
              scoreBefore: 50,
              scoreAfter: 0,
              bust: false,
              checkout: true,
            },
          ],
        }),
      ),
    ).toEqual({
      title: 'Game shot!',
      details: ['Checked out from 50'],
    })
  })

  it('summarizes practice completion modes', () => {
    expect(
      getSessionResultSummary(
        sampleSession({
          mode: GameModeId.AroundTheClock,
          config: { finishOnBull: true },
          visits: [],
        }),
      ),
    ).toBe('0 visits · Hit every target through bull')
  })

  it('summarizes early finishes for open-ended practice modes', () => {
    expect(
      getMatchSummary(
        sampleSession({
          mode: GameModeId.TenUpOneDown,
          config: {
            startScore: 60,
            incrementUp: 10,
            decrementDown: 1,
            minScore: 2,
            doubleOut: true,
          },
          finishedEarly: true,
          visits: [
            {
              visitIndex: 0,
              playerId: 'player-1',
              darts: [],
              visitScore: 60,
              scoreBefore: 60,
              scoreAfter: 70,
              bust: false,
              checkout: false,
            },
          ],
        }),
      ),
    ).toEqual({
      title: '10 Up 1 Down session ended',
      details: ['1 visit', 'Stopped on 70'],
    })
  })

  it('titles a 10 up 1 down win after checking out 170', () => {
    expect(
      getMatchSummary(
        sampleSession({
          mode: GameModeId.TenUpOneDown,
          config: {
            startScore: 60,
            incrementUp: 10,
            decrementDown: 1,
            minScore: 2,
            doubleOut: true,
          },
          visits: [
            {
              visitIndex: 0,
              playerId: 'player-1',
              darts: [],
              visitScore: 170,
              scoreBefore: 170,
              scoreAfter: 170,
              bust: false,
              checkout: true,
            },
          ],
        }),
      ).title,
    ).toBe('10 Up 1 Down complete')
  })

  it('titles a 10 up 1 down loss after failing at 2', () => {
    expect(
      getMatchSummary(
        sampleSession({
          mode: GameModeId.TenUpOneDown,
          config: {
            startScore: 60,
            incrementUp: 10,
            decrementDown: 1,
            minScore: 2,
            doubleOut: true,
          },
          visits: [
            {
              visitIndex: 0,
              playerId: 'player-1',
              darts: [],
              visitScore: 0,
              scoreBefore: 2,
              scoreAfter: 2,
              bust: true,
              checkout: false,
            },
          ],
        }),
      ).title,
    ).toBe('10 Up 1 Down game over')
  })

  it('sorts completed sessions newest first', () => {
    const older = sampleSession({
      id: 'older',
      completedAt: '2026-01-01T10:00:00.000Z',
    })
    const newer = sampleSession({
      id: 'newer',
      completedAt: '2026-01-02T10:00:00.000Z',
    })

    expect(sortSessionsByDate([older, newer])).toEqual([newer, older])
  })

  it('formats session dates for display', () => {
    expect(formatSessionDate('2026-01-01T10:15:00.000Z')).toMatch(/2026/u)
  })

  it('titles wins for the human player even when they are not first in the roster', () => {
    expect(
      getMatchSummary(
        sampleSession({
          players: [
            { id: 'opponent', name: 'Alex', kind: PlayerKind.Remote },
            { id: 'viewer', name: 'Timon', kind: PlayerKind.Human },
          ],
          matchProgress: {
            legsToWin: 1,
            currentLeg: 1,
            legWins: { viewer: 1, opponent: 0 },
            startingPlayerIndex: 0,
          },
          visits: [
            {
              visitIndex: 0,
              playerId: 'viewer',
              darts: [],
              visitScore: 40,
              scoreBefore: 40,
              scoreAfter: 0,
              bust: false,
              checkout: true,
            },
          ],
        }),
      ).title,
    ).toBe('Match won!')
  })

  it('labels two-player match results as a numeric leg score', () => {
    expect(
      getMatchResultLabel(
        sampleSession({
          players: [
            { id: 'viewer', name: 'Timon', kind: PlayerKind.Human },
            { id: 'opponent', name: 'Alex', kind: PlayerKind.Remote },
          ],
          matchProgress: {
            legsToWin: 2,
            currentLeg: 3,
            legWins: { viewer: 2, opponent: 1 },
            startingPlayerIndex: 0,
          },
        }),
      ),
    ).toBe('2:1')
  })

  it('labels challenge match results as a numeric win-loss score', () => {
    expect(
      getMatchResultLabel(
        sampleSession({
          matchProgress: {
            legsToWin: 3,
            currentLeg: 4,
            legWins: { 'player-1': 2 },
            legLosses: 1,
            startingPlayerIndex: 0,
            challenge: {
              maxVisits: 9,
              legEndMode: ChallengeLegEndMode.PlayToCheckout,
            },
          },
        }),
      ),
    ).toBe('2:1')
  })

  it('labels solo checkouts from the score detail', () => {
    expect(
      getMatchResultLabel(
        sampleSession({
          config: { startScore: 301, doubleIn: false, doubleOut: true },
          visits: [
            {
              visitIndex: 0,
              playerId: 'player-1',
              darts: [],
              visitScore: 50,
              scoreBefore: 50,
              scoreAfter: 0,
              bust: false,
              checkout: true,
            },
          ],
        }),
      ),
    ).toBe('Checked out from 50')
  })

  it('labels practice scores without win sentences', () => {
    expect(
      getMatchResultLabel(
        sampleSession({
          mode: GameModeId.BullRun,
          config: { targetScore: 50 },
          visits: [
            {
              visitIndex: 0,
              playerId: 'player-1',
              darts: [],
              visitScore: 25,
              scoreBefore: 0,
              scoreAfter: 25,
              bust: false,
              checkout: false,
            },
          ],
        }),
      ),
    ).toMatch(/pts$/u)

    expect(
      getMatchResultLabel(
        sampleSession({
          mode: GameModeId.AroundTheClock,
          config: { finishOnBull: true, aimMode: AroundTheClockAimMode.Singles },
          visits: [],
        }),
      ),
    ).toBeNull()

    expect(
      getMatchResultLabel(
        sampleSession({
          mode: GameModeId.TenUpOneDown,
          config: {
            startScore: 60,
            incrementUp: 10,
            decrementDown: 1,
            minScore: 2,
            doubleOut: true,
          },
          finishedEarly: true,
          visits: [
            {
              visitIndex: 0,
              playerId: 'player-1',
              darts: [],
              visitScore: 60,
              scoreBefore: 60,
              scoreAfter: 70,
              bust: false,
              checkout: false,
            },
          ],
        }),
      ),
    ).toBe('Stopped on 70')
  })

  it('builds a match summary header from format, time, and result', () => {
    expect(
      getMatchSummaryHeader(
        sampleSession({
          players: [
            { id: 'viewer', name: 'Timon', kind: PlayerKind.Human },
            { id: 'opponent', name: 'Alex', kind: PlayerKind.Remote },
          ],
          matchProgress: {
            legsToWin: 2,
            currentLeg: 3,
            legWins: { viewer: 2, opponent: 1 },
            startingPlayerIndex: 0,
          },
        }),
      ),
    ).toEqual({
      modeLabel: '501',
      completedAtLabel: formatSessionDate('2026-01-01T10:15:00.000Z'),
      resultLabel: '2:1',
    })
  })
})
