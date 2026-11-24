import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { DartMultiplier } from '@open-dart/game/types/dart'
import { numberDart } from '@open-dart/game/testHelpers'
import { AroundTheClockAimMode } from '@open-dart/game/types/aroundTheClock'
import { BigNumbersRequiredHits } from '@open-dart/game/types/bigNumbers'
import { NinetyNineDartsTargetKind } from '@open-dart/game/types/ninetyNineDarts'
import { NinetyNineDartsStatGroup } from './ninetyNineVisitStats'
import {
  PROFILE_STATS_VERSION,
  buildProfileStats,
  getRecentJdcChallengeBadge,
  orientSessionForProfileUser,
} from './buildProfileStats'

const NOW = new Date('2026-08-25T12:00:00.000Z')

const sampleVisit = (
  overrides: Partial<GameSession['visits'][number]> = {},
): GameSession['visits'][number] => ({
  visitIndex: 0,
  playerId: 'user-a',
  darts: [
    numberDart(20, DartMultiplier.Triple),
    numberDart(20, DartMultiplier.Triple),
    numberDart(20, DartMultiplier.Triple),
  ],
  visitScore: 180,
  scoreBefore: 501,
  scoreAfter: 321,
  bust: false,
  checkout: false,
  ...overrides,
})

const sampleSession = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  mode: GameModeId.X01,
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [{ id: 'user-a', name: 'A', kind: PlayerKind.Human }],
  visits: [sampleVisit()],
  status: GameStatus.Completed,
  startedAt: '2026-08-10T00:00:00.000Z',
  completedAt: '2026-08-10T00:00:00.000Z',
  ...overrides,
})

describe('orientSessionForProfileUser', () => {
  it('marks the profile user as the human primary player', () => {
    const session = sampleSession({
      players: [
        { id: 'user-a', name: 'A', kind: PlayerKind.Remote },
        { id: 'user-b', name: 'B', kind: PlayerKind.Human },
      ],
    })

    const oriented = orientSessionForProfileUser(session, 'user-a')
    expect(oriented.players[0]?.kind).toBe(PlayerKind.Human)
    expect(oriented.players[1]?.kind).toBe(PlayerKind.Remote)
  })
})

describe('buildProfileStats', () => {
  it('returns version 3 x01 groups with an absolute 30-day window', () => {
    const online = sampleSession({
      id: 'online-1',
      players: [
        { id: 'user-a', name: 'A', kind: PlayerKind.Human },
        { id: 'user-b', name: 'B', kind: PlayerKind.Remote },
      ],
      matchProgress: {
        legsToWin: 1,
        startingPlayerIndex: 0,
        currentLeg: 1,
        legWins: { 'user-a': 1, 'user-b': 0 },
      },
      visits: [
        sampleVisit({ legIndex: 1 }),
        sampleVisit({
          visitIndex: 1,
          playerId: 'user-b',
          visitScore: 60,
          scoreBefore: 501,
          scoreAfter: 441,
          darts: [numberDart(20, DartMultiplier.Single)],
          legIndex: 1,
        }),
        sampleVisit({
          visitIndex: 2,
          visitScore: 321,
          scoreBefore: 321,
          scoreAfter: 0,
          checkout: true,
          legIndex: 1,
          darts: [
            numberDart(20, DartMultiplier.Triple),
            numberDart(19, DartMultiplier.Triple),
            numberDart(12, DartMultiplier.Double),
          ],
        }),
      ],
    })

    const bobRecent = sampleSession({
      id: 'bob-1',
      mode: GameModeId.Bob27,
      config: { startScore: 27 },
      completedAt: '2026-08-20T00:00:00.000Z',
      visits: [
        sampleVisit({
          visitScore: 40,
          scoreBefore: 27,
          scoreAfter: 67,
          darts: [numberDart(20, DartMultiplier.Double)],
        }),
      ],
    })

    const bobOld = sampleSession({
      id: 'bob-old',
      mode: GameModeId.Bob27,
      config: { startScore: 27 },
      completedAt: '2025-01-01T00:00:00.000Z',
      visits: [sampleVisit({ visitScore: 10, scoreBefore: 27, scoreAfter: 37 })],
    })

    const stats = buildProfileStats({
      displayName: 'Alex',
      profileUserId: 'user-a',
      onlineSessions: [online],
      practiceSessions: [bobRecent, bobOld],
      now: NOW,
    })

    expect(stats.version).toBe(PROFILE_STATS_VERSION)
    expect(stats.version).toBe(3)
    expect(stats.displayName).toBe('Alex')
    expect(stats.window.endAt).toBe(NOW.toISOString())
    expect(stats.x01.fiveOhOneOnline.legsPlayed).toBe(1)
    expect(stats.x01.fiveOhOne.legsPlayed).toBe(1)
    expect(stats.x01.all.legsPlayed).toBe(1)
    expect(stats.x01.oneSeventy.legsPlayed).toBe(0)
    expect(stats.x01.fiveOhOne.legWinRate).toBe(100)
    expect(stats.x01.fiveOhOne.bestDarts).toBe(6)
    expect(stats.x01.fiveOhOne.thrown180).toBe(1)
    expect(stats.x01.fiveOhOne).not.toHaveProperty('bestLegSource')
    expect(stats.x01.fiveOhOne).not.toHaveProperty('bestDartsSource')
    expect(stats.x01.fiveOhOne).not.toHaveProperty('bestLegDarts')
    expect(stats.bob27?.sessionsPlayed).toBe(1)
    expect(stats).not.toHaveProperty('aroundTheClock')
    expect(stats).not.toHaveProperty('fiveOhOne')
    const serialized = JSON.stringify(stats)
    expect(serialized).not.toMatch(/"visits"/u)
    expect(serialized).not.toMatch(/"payload"/u)
    expect(serialized).not.toMatch(/"sessionId"/u)
    expect(serialized).not.toMatch(/"legNumber"/u)
  })

  it('keeps local 501 out of the online group and 170 out of 501', () => {
    const local501 = sampleSession({ id: 'local-501' })
    const online501 = sampleSession({
      id: 'online-501',
      players: [
        { id: 'user-a', name: 'A', kind: PlayerKind.Human },
        { id: 'user-b', name: 'B', kind: PlayerKind.Remote },
      ],
    })
    const local170 = sampleSession({
      id: 'local-170',
      config: { startScore: 170, doubleIn: false, doubleOut: true },
      visits: [sampleVisit({ scoreBefore: 170, scoreAfter: 0, visitScore: 170, checkout: true })],
    })
    const duplicateOnline = sampleSession({
      id: 'online-501',
      players: [{ id: 'user-a', name: 'A', kind: PlayerKind.Human }],
    })

    const stats = buildProfileStats({
      displayName: 'Alex',
      profileUserId: 'user-a',
      onlineSessions: [online501],
      localX01Sessions: [local501, local170, duplicateOnline],
      practiceSessions: [],
      now: NOW,
    })

    expect(stats.x01.fiveOhOneOnline.legsPlayed).toBe(1)
    expect(stats.x01.fiveOhOne.legsPlayed).toBe(2)
    expect(stats.x01.oneSeventy.legsPlayed).toBe(1)
    expect(stats.x01.all.legsPlayed).toBe(3)
  })

  it('omits empty mode blocks', () => {
    const stats = buildProfileStats({
      displayName: 'Alex',
      profileUserId: 'user-a',
      onlineSessions: [],
      practiceSessions: [],
      now: NOW,
    })

    expect(stats.x01.fiveOhOne.legsPlayed).toBe(0)
    expect(stats.x01.fiveOhOneOnline.legsPlayed).toBe(0)
    expect(stats.x01.oneSeventy.legsPlayed).toBe(0)
    expect(stats.x01.all.legsPlayed).toBe(0)
    expect(stats.bob27).toBeNull()
    expect(stats.ninetyNineDarts).toBeNull()
    expect(stats.bigNumbers).toBeNull()
    expect(stats.jdcChallenge).toBeNull()
  })

  it('pools Big Numbers hit rates across required-hit settings', () => {
    const oneHit = sampleSession({
      id: 'bn-1',
      mode: GameModeId.BigNumbers,
      config: { requiredHits: BigNumbersRequiredHits.One },
      completedAt: '2026-08-10T00:00:00.000Z',
      visits: [
        sampleVisit({
          visitScore: 1,
          scoreBefore: 1,
          scoreAfter: 2,
          darts: [numberDart(1, DartMultiplier.Single)],
          metadata: { hitCount: 1, advanced: true, targetLabel: '1' },
        }),
      ],
    })
    const threeHits = sampleSession({
      id: 'bn-3',
      mode: GameModeId.BigNumbers,
      config: { requiredHits: BigNumbersRequiredHits.Three },
      completedAt: '2026-08-20T00:00:00.000Z',
      visits: [
        sampleVisit({
          visitScore: 3,
          scoreBefore: 1,
          scoreAfter: 2,
          darts: [
            numberDart(1, DartMultiplier.Single),
            numberDart(1, DartMultiplier.Single),
            numberDart(1, DartMultiplier.Single),
          ],
          metadata: { hitCount: 3, advanced: true, targetLabel: '1' },
        }),
      ],
    })
    const outsideWindow = sampleSession({
      id: 'bn-old',
      mode: GameModeId.BigNumbers,
      config: { requiredHits: BigNumbersRequiredHits.Two },
      completedAt: '2026-01-01T00:00:00.000Z',
      visits: [
        sampleVisit({
          visitScore: 2,
          scoreBefore: 1,
          scoreAfter: 2,
          metadata: { hitCount: 2, advanced: true, targetLabel: '1' },
        }),
      ],
    })

    const stats = buildProfileStats({
      displayName: 'Alex',
      profileUserId: 'user-a',
      onlineSessions: [],
      practiceSessions: [oneHit, threeHits, outsideWindow],
      now: NOW,
    })

    expect(stats.bigNumbers?.sessionsPlayed).toBe(2)
    expect(stats.bigNumbers?.hitRate).toBe((4 / 4) * 100)
    expect(stats.bigNumbers?.bestHitRate).toBe(100)
    expect(stats.bigNumbers).not.toHaveProperty('avgHitsPerVisit')
  })

  it('uses absolute windows and group-scoped 99 Darts sessions', () => {
    const ninetyNineAtTwenty = sampleSession({
      id: '99-at-20',
      mode: GameModeId.NinetyNineDarts,
      config: {
        target: { kind: NinetyNineDartsTargetKind.Number, value: 20 },
      },
      completedAt: '2026-08-05T00:00:00.000Z',
      visits: [
        sampleVisit({
          visitScore: 9,
          scoreBefore: 0,
          scoreAfter: 9,
        }),
      ],
    })
    const ninetyNineBull = sampleSession({
      id: '99-bull',
      mode: GameModeId.NinetyNineDarts,
      config: { target: { kind: NinetyNineDartsTargetKind.Bull } },
      completedAt: '2026-08-15T00:00:00.000Z',
      visits: [sampleVisit({ visitScore: 6, scoreBefore: 0, scoreAfter: 6 })],
    })
    const olderNinetyNine = sampleSession({
      id: '99-old',
      mode: GameModeId.NinetyNineDarts,
      config: {
        target: { kind: NinetyNineDartsTargetKind.Number, value: 20 },
      },
      completedAt: '2026-01-01T00:00:00.000Z',
      visits: [sampleVisit({ visitScore: 9, scoreBefore: 0, scoreAfter: 9 })],
    })
    const newerBob = sampleSession({
      id: 'newer-bob',
      mode: GameModeId.Bob27,
      config: { startScore: 27 },
      completedAt: '2026-08-18T00:00:00.000Z',
      visits: [sampleVisit({ visitScore: 40, scoreBefore: 27, scoreAfter: 67 })],
    })
    const aroundSingles = sampleSession({
      id: 'atc-singles',
      mode: GameModeId.AroundTheClock,
      config: { finishOnBull: false, aimMode: AroundTheClockAimMode.Singles },
      completedAt: '2026-08-12T00:00:00.000Z',
      visits: [sampleVisit({ visitScore: 1, scoreBefore: 0, scoreAfter: 1, checkout: true })],
    })

    const stats = buildProfileStats({
      displayName: 'Alex',
      profileUserId: 'user-a',
      onlineSessions: [],
      practiceSessions: [
        ninetyNineAtTwenty,
        ninetyNineBull,
        olderNinetyNine,
        newerBob,
        aroundSingles,
      ],
      now: NOW,
    })

    expect(stats.ninetyNineDarts?.groups).toHaveLength(2)
    const twenty = stats.ninetyNineDarts?.groups.find(
      (group) => group.group === NinetyNineDartsStatGroup.Twenty,
    )
    const bull = stats.ninetyNineDarts?.groups.find(
      (group) => group.group === NinetyNineDartsStatGroup.Bull,
    )
    expect(twenty?.sessionsPlayed).toBe(1)
    expect(twenty?.avgFinalScore).toBe(9)
    expect(twenty?.bestFinalScore).toBe(9)
    expect(twenty?.avgTreblesPerGame).toBe(3)
    expect(bull?.sessionsPlayed).toBe(1)
    expect(stats.bob27?.sessionsPlayed).toBe(1)
    expect(stats).not.toHaveProperty('aroundTheClock')
  })

  it('only badges the best finished JDC score in the last 30 days', () => {
    const recent = sampleSession({
      id: 'jdc-recent',
      mode: GameModeId.JdcChallenge,
      config: {},
      completedAt: '2026-08-10T00:00:00.000Z',
      finishedEarly: false,
      visits: [
        sampleVisit({
          visitScore: 60,
          scoreBefore: 0,
          scoreAfter: 60,
        }),
      ],
    })
    const olderThan30Days = sampleSession({
      id: 'jdc-old',
      mode: GameModeId.JdcChallenge,
      config: {},
      completedAt: '2026-07-20T00:00:00.000Z',
      finishedEarly: false,
      visits: [
        sampleVisit({
          visitScore: 120,
          scoreBefore: 0,
          scoreAfter: 120,
        }),
      ],
    })

    const withBadge = buildProfileStats({
      displayName: 'Alex',
      profileUserId: 'user-a',
      onlineSessions: [],
      practiceSessions: [recent, olderThan30Days],
      now: NOW,
    })

    const recentOnly = buildProfileStats({
      displayName: 'Alex',
      profileUserId: 'user-a',
      onlineSessions: [],
      practiceSessions: [recent],
      now: NOW,
    })

    expect(withBadge.jdcChallenge?.badge).toEqual(recentOnly.jdcChallenge?.badge)
    expect(withBadge.jdcChallenge?.badge).not.toBeNull()
    expect(withBadge.jdcChallenge?.badge).not.toHaveProperty('bestEverGrade')
    expect(withBadge.jdcChallenge?.badge).not.toHaveProperty('isCurrentMonth')

    const withoutRecentScore = buildProfileStats({
      displayName: 'Alex',
      profileUserId: 'user-a',
      onlineSessions: [],
      practiceSessions: [olderThan30Days],
      now: NOW,
    })

    expect(withoutRecentScore.jdcChallenge).toBeNull()
  })
})

describe('getRecentJdcChallengeBadge', () => {
  const jdcSession = (overrides: Partial<GameSession>): GameSession =>
    sampleSession({
      mode: GameModeId.JdcChallenge,
      config: {},
      finishedEarly: false,
      visits: [sampleVisit({ visitScore: 60, scoreBefore: 0, scoreAfter: 60 })],
      ...overrides,
    })

  it('ignores unfinished games and games older than 30 days', () => {
    expect(
      getRecentJdcChallengeBadge(
        [
          jdcSession({ id: 'early', finishedEarly: true }),
          jdcSession({ id: 'old', completedAt: '2026-07-20T00:00:00.000Z' }),
        ],
        NOW,
      ),
    ).toBeNull()
  })

  it('includes a previous calendar month when it is still inside 30 days', () => {
    expect(
      getRecentJdcChallengeBadge(
        [jdcSession({ id: 'previous-month', completedAt: '2026-07-31T00:00:00.000Z' })],
        NOW,
      ),
    ).not.toBeNull()
  })

  it('picks the best finished score in the last 30 days', () => {
    const badge = getRecentJdcChallengeBadge(
      [
        jdcSession({ id: 'low' }),
        jdcSession({
          id: 'high',
          visits: [sampleVisit({ visitScore: 120, scoreBefore: 0, scoreAfter: 120 })],
        }),
        jdcSession({ id: 'previous-month', completedAt: '2026-07-31T00:00:00.000Z' }),
        sampleSession({ id: 'x01' }),
      ],
      NOW,
    )

    const lowBadge = getRecentJdcChallengeBadge([jdcSession({ id: 'low' })], NOW)
    expect(badge).not.toBeNull()
    expect(lowBadge).not.toBeNull()
    expect(badge?.score).toBeGreaterThanOrEqual(lowBadge?.score ?? 0)
  })
})
