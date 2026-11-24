import { describe, expect, it } from 'vitest'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { DartMultiplier } from '@open-dart/game/types/dart'
import { BigNumbersRequiredHits } from '@open-dart/game/types/bigNumbers'
import { numberDart } from '@open-dart/game/testHelpers'
import { buildStatTimeline, formatTimelineSecondary, hasPlottableTimeline } from './statTimelines'

const sampleVisit = (
  overrides: Partial<GameSession['visits'][number]> = {},
): GameSession['visits'][number] => ({
  visitIndex: 0,
  playerId: 'player-1',
  darts: [numberDart(20, DartMultiplier.Triple)],
  visitScore: 60,
  scoreBefore: 501,
  scoreAfter: 441,
  bust: false,
  checkout: false,
  ...overrides,
})

const sampleSession = (overrides: Partial<GameSession> = {}): GameSession => ({
  id: 'session-1',
  mode: GameModeId.X01,
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [{ id: 'player-1', name: 'You', kind: PlayerKind.Human }],
  visits: [sampleVisit()],
  status: GameStatus.Completed,
  startedAt: '2026-01-01T10:00:00.000Z',
  completedAt: '2026-01-01T10:00:00.000Z',
  ...overrides,
})

describe('statTimelines', () => {
  it('builds a chronological x01 timeline for a selected metric', () => {
    const timeline = buildStatTimeline(
      [
        sampleSession({
          id: 'later',
          completedAt: '2026-01-02T10:00:00.000Z',
          visits: [
            sampleVisit({ visitScore: 100, scoreBefore: 501, scoreAfter: 401 }),
            sampleVisit({
              visitIndex: 1,
              checkout: true,
              visitScore: 50,
              scoreBefore: 50,
              scoreAfter: 0,
            }),
          ],
        }),
        sampleSession({
          id: 'earlier',
          completedAt: '2026-01-01T10:00:00.000Z',
          visits: [sampleVisit({ visitScore: 80, scoreBefore: 501, scoreAfter: 421 })],
        }),
      ],
      {
        scope: { type: 'x01-501' },
        metric: 'threeDartAverage',
        metricLabel: '3-dart average',
        scopeLabel: '501',
        secondary: [{ metric: 'avgDarts', suffix: ' darts', emptyLabel: '(not finished)' }],
      },
    )

    expect(timeline.pointUnitLabel).toBe('leg')
    expect(timeline.points.map((point) => point.sessionId)).toEqual([
      'earlier:leg:1',
      'later:leg:1',
    ])
    expect(timeline.points[0]?.value).toBe(80)
    expect(timeline.points[1]?.value).toBe(75)
    expect(timeline.points.map((point) => formatTimelineSecondary(point.secondaryValues))).toEqual([
      '(not finished)',
      '2 darts',
    ])
    expect(hasPlottableTimeline(timeline)).toBe(true)
  })

  it('returns null dart values for unchecked x01 legs', () => {
    const timeline = buildStatTimeline([sampleSession({ id: 'unfinished', finishedEarly: true })], {
      scope: { type: 'x01-501' },
      metric: 'avgDarts',
      metricLabel: 'Avg darts',
      scopeLabel: '501',
    })

    expect(timeline.points[0]?.value).toBeNull()
    expect(hasPlottableTimeline(timeline)).toBe(false)
  })

  it('builds per-leg thrown 180 counts', () => {
    const timeline = buildStatTimeline(
      [
        sampleSession({
          id: 'without-180',
          completedAt: '2026-01-01T10:00:00.000Z',
          visits: [sampleVisit({ visitScore: 60, scoreBefore: 501, scoreAfter: 441 })],
        }),
        sampleSession({
          id: 'with-180',
          completedAt: '2026-01-02T10:00:00.000Z',
          visits: [
            sampleVisit({ visitScore: 180, scoreBefore: 501, scoreAfter: 321 }),
            sampleVisit({
              visitIndex: 1,
              checkout: true,
              visitScore: 40,
              scoreBefore: 40,
              scoreAfter: 0,
              darts: [numberDart(20, DartMultiplier.Double)],
            }),
          ],
        }),
      ],
      {
        scope: { type: 'x01-501' },
        metric: 'thrown180',
        metricLabel: '180',
        scopeLabel: '501',
      },
    )

    expect(timeline.points[0]?.value).toBe(0)
    expect(timeline.points[1]?.value).toBe(1)
  })

  it('emits one timeline point per leg in a multi-leg match', () => {
    const timeline = buildStatTimeline(
      [
        sampleSession({
          id: 'best-of-three',
          completedAt: '2026-01-03T10:00:00.000Z',
          visits: [
            sampleVisit({
              visitScore: 100,
              scoreBefore: 501,
              scoreAfter: 401,
              legIndex: 1,
            }),
            sampleVisit({
              visitIndex: 1,
              checkout: true,
              visitScore: 100,
              scoreBefore: 100,
              scoreAfter: 0,
              legIndex: 1,
            }),
            sampleVisit({
              visitIndex: 2,
              visitScore: 40,
              scoreBefore: 501,
              scoreAfter: 461,
              legIndex: 2,
            }),
            sampleVisit({
              visitIndex: 3,
              checkout: true,
              visitScore: 40,
              scoreBefore: 40,
              scoreAfter: 0,
              legIndex: 2,
            }),
          ],
        }),
      ],
      {
        scope: { type: 'x01-501' },
        metric: 'threeDartAverage',
        metricLabel: '3-dart average',
        scopeLabel: '501',
      },
    )

    expect(timeline.points).toHaveLength(2)
    expect(timeline.points.map((point) => point.sessionId)).toEqual([
      'best-of-three:leg:1',
      'best-of-three:leg:2',
    ])
    expect(timeline.points[0]?.value).toBe(100)
    expect(timeline.points[1]?.value).toBe(40)
    expect(timeline.points[0]?.sessionLabel).toBe('501 · Leg 1')
    expect(timeline.points[1]?.sessionLabel).toBe('501 · Leg 2')
  })

  it('omits legs that were not checked out', () => {
    const timeline = buildStatTimeline(
      [
        sampleSession({
          id: 'best-of-three',
          completedAt: '2026-01-03T10:00:00.000Z',
          visits: [
            sampleVisit({
              visitScore: 100,
              scoreBefore: 501,
              scoreAfter: 401,
              legIndex: 1,
            }),
            sampleVisit({
              visitIndex: 1,
              checkout: true,
              visitScore: 100,
              scoreBefore: 100,
              scoreAfter: 0,
              legIndex: 1,
            }),
            sampleVisit({
              visitIndex: 2,
              visitScore: 40,
              scoreBefore: 501,
              scoreAfter: 461,
              legIndex: 2,
            }),
          ],
        }),
        sampleSession({
          id: 'abandoned',
          completedAt: '2026-01-01T10:00:00.000Z',
          visits: [sampleVisit({ visitScore: 180, scoreBefore: 501, scoreAfter: 321 })],
        }),
      ],
      {
        scope: { type: 'x01-501' },
        metric: 'threeDartAverage',
        metricLabel: '3-dart average',
        scopeLabel: '501 · checked out',
        checkedOutOnly: true,
      },
    )

    expect(timeline.points).toHaveLength(1)
    expect(timeline.points[0]?.sessionId).toBe('best-of-three:leg:1')
    expect(timeline.points[0]?.value).toBe(100)
    expect(timeline.points[0]?.sessionLabel).toBe('501 · Leg 1')
  })

  it('puts Bob 27 visit and game counts on the same timeline point', () => {
    const timeline = buildStatTimeline(
      [
        sampleSession({
          id: 'bob-low',
          mode: GameModeId.Bob27,
          config: { startScore: 27 },
          completedAt: '2026-01-01T10:00:00.000Z',
          visits: [
            sampleVisit({ metadata: { targetLabel: 'D1', hit: true, hitCount: 1 } }),
            sampleVisit({
              visitIndex: 1,
              metadata: { targetLabel: 'D2', hit: false, hitCount: 0 },
            }),
          ],
        }),
        sampleSession({
          id: 'bob-high',
          mode: GameModeId.Bob27,
          config: { startScore: 27 },
          completedAt: '2026-01-02T10:00:00.000Z',
          visits: [
            sampleVisit({ metadata: { targetLabel: 'D1', hit: true, hitCount: 3 } }),
            sampleVisit({
              visitIndex: 1,
              metadata: { targetLabel: 'Bull', hit: true, hitCount: 2 },
            }),
          ],
        }),
      ],
      {
        scope: { type: 'practice-bob27' },
        metric: 'hitRate',
        metricLabel: 'Hit rate',
        scopeLabel: "Bob's 27",
        secondary: [
          { metric: 'avgHitsPerVisit', suffix: ' Visit /' },
          { metric: 'avgDoublesPerGame', suffix: ' Game', digits: 1 },
        ],
      },
    )

    expect(timeline.format).toBe('percent')
    expect(timeline.points.map((point) => formatTimelineSecondary(point.secondaryValues))).toEqual([
      '0.50 Visit / 1.0 Game',
      '2.50 Visit / 5.0 Game',
    ])
  })

  it('builds big numbers hit-rate timeline points for pooled sessions', () => {
    const timeline = buildStatTimeline(
      [
        sampleSession({
          id: 'bn-low',
          mode: GameModeId.BigNumbers,
          config: { requiredHits: BigNumbersRequiredHits.Two },
          completedAt: '2026-01-01T10:00:00.000Z',
          visits: [
            sampleVisit({
              visitScore: 1,
              scoreBefore: 1,
              scoreAfter: 1,
              darts: [
                numberDart(1, DartMultiplier.Single),
                numberDart(1, DartMultiplier.Single),
                numberDart(1, DartMultiplier.Single),
              ],
              metadata: { hitCount: 1, targetLabel: '1', advanced: false },
            }),
          ],
        }),
        sampleSession({
          id: 'bn-high',
          mode: GameModeId.BigNumbers,
          config: { requiredHits: BigNumbersRequiredHits.One },
          completedAt: '2026-01-02T10:00:00.000Z',
          visits: [
            sampleVisit({
              visitScore: 2,
              scoreBefore: 1,
              scoreAfter: 2,
              darts: [numberDart(1, DartMultiplier.Single), numberDart(1, DartMultiplier.Single)],
              metadata: { hitCount: 2, targetLabel: '1', advanced: true },
            }),
          ],
        }),
      ],
      {
        scope: { type: 'practice-big-numbers' },
        metric: 'bestHitRate',
        metricLabel: 'Best hit rate',
        scopeLabel: 'Big Numbers',
      },
    )

    expect(timeline.format).toBe('percent')
    expect(timeline.points.map((point) => point.sessionId)).toEqual(['bn-low', 'bn-high'])
    expect(timeline.points.map((point) => point.value)).toEqual([(1 / 3) * 100, 100])
  })

  it('builds hunter advances-per-visit timeline points', () => {
    const timeline = buildStatTimeline(
      [
        sampleSession({
          id: 'hunter-1',
          mode: GameModeId.Hunter,
          config: { startingPlayerIndex: 0 },
          completedAt: '2026-01-01T10:00:00.000Z',
          visits: [
            sampleVisit({
              visitScore: 2,
              scoreBefore: 1,
              scoreAfter: 5,
              darts: [
                numberDart(1, DartMultiplier.Single),
                numberDart(18, DartMultiplier.Single),
                numberDart(4, DartMultiplier.Double),
              ],
              metadata: { fieldNumber: 1, advances: 2 },
            }),
          ],
        }),
      ],
      {
        scope: { type: 'practice-hunter' },
        metric: 'avgAdvancesPerVisit',
        metricLabel: 'Advances / visit',
        scopeLabel: 'Hunter',
      },
    )

    expect(timeline.format).toBe('average')
    expect(timeline.points).toHaveLength(1)
    expect(timeline.points[0]?.value).toBe(2)
  })

  it('builds 121 checkouts-per-game timeline points', () => {
    const timeline = buildStatTimeline(
      [
        sampleSession({
          id: '121-low',
          mode: GameModeId.OneTwentyOne,
          config: {
            startScore: 121,
            increment: 1,
            startingLives: 3,
            maxVisitsPerTarget: 3,
            doubleOut: true,
          },
          completedAt: '2026-01-01T10:00:00.000Z',
          visits: [
            sampleVisit({ checkout: true, scoreBefore: 121, scoreAfter: 122, visitScore: 121 }),
          ],
        }),
        sampleSession({
          id: '121-high',
          mode: GameModeId.OneTwentyOne,
          config: {
            startScore: 121,
            increment: 1,
            startingLives: 3,
            maxVisitsPerTarget: 3,
            doubleOut: true,
          },
          completedAt: '2026-01-02T10:00:00.000Z',
          visits: [
            sampleVisit({ checkout: true, scoreBefore: 121, scoreAfter: 122, visitScore: 121 }),
            sampleVisit({
              visitIndex: 1,
              checkout: true,
              scoreBefore: 140,
              scoreAfter: 141,
              visitScore: 140,
            }),
          ],
        }),
      ],
      {
        scope: { type: 'practice-checkout', mode: GameModeId.OneTwentyOne },
        metric: 'bestCheckoutsPerGame',
        metricLabel: 'Checkouts / game',
        scopeLabel: '121',
      },
    )

    expect(timeline.format).toBe('integer')
    expect(timeline.points.map((point) => point.value)).toEqual([1, 2])
  })

  it('limits the online 501 scope to games with a remote opponent', () => {
    const timeline = buildStatTimeline(
      [
        sampleSession({ id: 'local' }),
        sampleSession({
          id: 'online',
          players: [
            { id: 'player-1', name: 'You', kind: PlayerKind.Human },
            { id: 'player-2', name: 'Them', kind: PlayerKind.Remote },
          ],
        }),
      ],
      {
        scope: { type: 'x01-501-online' },
        metric: 'bestLegAverage',
        metricLabel: 'Best leg average',
        scopeLabel: '501 online',
      },
    )

    expect(timeline.points.map((point) => point.sessionId)).toEqual(['online:leg:1'])
    expect(timeline.points[0]?.value).toBe(60)
  })
})
