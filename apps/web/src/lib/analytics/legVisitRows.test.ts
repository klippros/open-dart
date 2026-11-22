import { describe, expect, it } from 'vitest'
import { DartMultiplier } from '@open-dart/game/types/dart'
import { numberDart } from '@open-dart/game/testHelpers'
import { buildLegVisitRows, formatLegVisitScore } from './legVisitRows'
import { getLegWinnerIdFromVisits } from '@open-dart/game/game/matchLegs'
import type { Visit } from '@open-dart/game/types/visit'

const visit = (overrides: Partial<Visit> = {}): Visit => ({
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

describe('legVisitRows', () => {
  it('returns the checkout player as the leg winner', () => {
    const visits = [
      visit({ visitIndex: 0, playerId: 'player-1', legIndex: 1 }),
      visit({
        visitIndex: 1,
        playerId: 'player-2',
        checkout: true,
        scoreBefore: 40,
        scoreAfter: 0,
        legIndex: 1,
      }),
    ]

    expect(getLegWinnerIdFromVisits(visits, 1)).toBe('player-2')
    expect(getLegWinnerIdFromVisits(visits, 2)).toBeUndefined()
  })

  it('formats bust visits as Bust', () => {
    expect(formatLegVisitScore(visit({ bust: true, visitScore: 0 }))).toBe('Bust')
    expect(formatLegVisitScore(visit({ visitScore: 180 }))).toBe('180')
  })

  it('pairs each player nth visit on the same row for two players', () => {
    const rows = buildLegVisitRows(
      [
        visit({ visitIndex: 0, playerId: 'player-1', visitScore: 180 }),
        visit({ visitIndex: 1, playerId: 'player-2', visitScore: 140 }),
        visit({ visitIndex: 2, playerId: 'player-1', visitScore: 100 }),
        visit({ visitIndex: 3, playerId: 'player-2', visitScore: 0, bust: true }),
      ],
      ['player-1', 'player-2'],
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]?.label).toBe('Visit 1')
    expect(rows[0]?.getCellValue('player-1')).toBe('180')
    expect(rows[0]?.getCellValue('player-2')).toBe('140')
    expect(rows[1]?.getCellValue('player-1')).toBe('100')
    expect(rows[1]?.getCellValue('player-2')).toBe('Bust')
    expect(rows[1]?.getCellColor?.('player-2')).toBe('red.300')
  })

  it('shows a dash when one player has fewer visits in the leg', () => {
    const rows = buildLegVisitRows(
      [
        visit({ visitIndex: 0, playerId: 'player-1', visitScore: 180 }),
        visit({ visitIndex: 1, playerId: 'player-2', visitScore: 140 }),
        visit({
          visitIndex: 2,
          playerId: 'player-1',
          visitScore: 121,
          checkout: true,
          scoreBefore: 121,
          scoreAfter: 0,
        }),
      ],
      ['player-1', 'player-2'],
    )

    expect(rows).toHaveLength(2)
    expect(rows[1]?.getCellValue('player-1')).toBe('121')
    expect(rows[1]?.getCellValue('player-2')).toBe('—')
  })

  it('keeps chronological rows for solo players', () => {
    const rows = buildLegVisitRows(
      [
        visit({ visitIndex: 0, playerId: 'player-1', visitScore: 180 }),
        visit({ visitIndex: 1, playerId: 'player-1', visitScore: 140 }),
      ],
      ['player-1'],
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]?.getCellValue('player-1')).toBe('180')
    expect(rows[1]?.getCellValue('player-1')).toBe('140')
  })

  it('shows recorded darts under the visit score for per-dart visits', () => {
    const rows = buildLegVisitRows(
      [
        visit({
          visitIndex: 0,
          playerId: 'player-1',
          visitScore: 180,
          darts: [
            numberDart(20, DartMultiplier.Triple),
            numberDart(20, DartMultiplier.Triple),
            numberDart(20, DartMultiplier.Triple),
          ],
        }),
        visit({
          visitIndex: 1,
          playerId: 'player-2',
          visitScore: 100,
          darts: [numberDart(20, DartMultiplier.Triple), numberDart(20, DartMultiplier.Double)],
        }),
      ],
      ['player-1', 'player-2'],
    )

    expect(rows[0]?.getCellDetail?.('player-1')).toBe('T20 · T20 · T20')
    expect(rows[0]?.getCellDetail?.('player-2')).toBe('T20 · D20')
  })

  it('omits dart detail for visit-score input with empty darts', () => {
    const rows = buildLegVisitRows(
      [visit({ visitIndex: 0, playerId: 'player-1', visitScore: 100, darts: [] })],
      ['player-1'],
    )

    expect(rows[0]?.getCellValue('player-1')).toBe('100')
    expect(rows[0]?.getCellDetail?.('player-1')).toBeUndefined()
  })

  it('omits dart detail for the other player dash cell', () => {
    const rows = buildLegVisitRows(
      [
        visit({
          visitIndex: 0,
          playerId: 'player-1',
          visitScore: 180,
          darts: [
            numberDart(20, DartMultiplier.Triple),
            numberDart(20, DartMultiplier.Triple),
            numberDart(20, DartMultiplier.Triple),
          ],
        }),
        visit({
          visitIndex: 1,
          playerId: 'player-2',
          visitScore: 140,
          darts: [
            numberDart(20, DartMultiplier.Triple),
            numberDart(20, DartMultiplier.Double),
            numberDart(20, DartMultiplier.Single),
          ],
        }),
        visit({
          visitIndex: 2,
          playerId: 'player-1',
          visitScore: 121,
          checkout: true,
          scoreBefore: 121,
          scoreAfter: 0,
          darts: [
            numberDart(20, DartMultiplier.Triple),
            numberDart(19, DartMultiplier.Triple),
            numberDart(16, DartMultiplier.Double),
          ],
        }),
      ],
      ['player-1', 'player-2'],
    )

    expect(rows[1]?.getCellValue('player-2')).toBe('—')
    expect(rows[1]?.getCellDetail?.('player-2')).toBeUndefined()
    expect(rows[1]?.getCellDetail?.('player-1')).toBe('T20 · T19 · D16')
  })

  it('keeps bust color and lists darts for bust visits', () => {
    const rows = buildLegVisitRows(
      [
        visit({
          visitIndex: 0,
          playerId: 'player-1',
          visitScore: 0,
          bust: true,
          darts: [
            numberDart(20, DartMultiplier.Triple),
            numberDart(20, DartMultiplier.Triple),
            numberDart(20, DartMultiplier.Single),
          ],
        }),
      ],
      ['player-1'],
    )

    expect(rows[0]?.getCellValue('player-1')).toBe('Bust')
    expect(rows[0]?.getCellColor?.('player-1')).toBe('red.300')
    expect(rows[0]?.getCellDetail?.('player-1')).toBe('T20 · T20 · 20')
  })
})
