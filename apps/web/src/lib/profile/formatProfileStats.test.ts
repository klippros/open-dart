import { describe, expect, it } from 'vitest'
import type { ProfileBigNumbersStats, ProfileFiveOhOneStats } from '@open-dart/analytics'
import { buildBigNumbersRows, buildFiveOhOneRows } from './formatProfileStats'

const sampleFiveOhOne = (
  overrides: Partial<ProfileFiveOhOneStats> = {},
): ProfileFiveOhOneStats => ({
  window: {
    startAt: '2026-01-01T00:00:00.000Z',
    endAt: '2026-01-31T00:00:00.000Z',
  },
  threeDartAverage: 80.5,
  threeDartAverageUntil170: 85,
  checkoutPercent: 40,
  legsPlayed: 10,
  legWinRate: 55,
  dartsThrown: 300,
  bestLegDarts: 15,
  highestCheckout: 120,
  highestVisit: 140,
  thrown180: null,
  ...overrides,
})

describe('buildFiveOhOneRows', () => {
  it('omits null values and switches to 180s when present', () => {
    const without180 = buildFiveOhOneRows(sampleFiveOhOne({ legWinRate: null }))
    expect(without180.some((row) => row.label === '501 leg win rate')).toBe(false)
    expect(without180.some((row) => row.label === 'Highest visit')).toBe(true)

    const with180 = buildFiveOhOneRows(sampleFiveOhOne({ thrown180: 3, highestVisit: null }))
    expect(with180.some((row) => row.label === '180s' && row.value === '3')).toBe(true)
    expect(with180.some((row) => row.label === 'Highest visit')).toBe(false)
  })
})

describe('buildBigNumbersRows', () => {
  it('formats sessions played and avg hits per visit', () => {
    const stats: ProfileBigNumbersStats = {
      window: {
        startAt: '2026-01-01T00:00:00.000Z',
        endAt: '2026-01-31T00:00:00.000Z',
      },
      sessionsPlayed: 4,
      avgHitsPerVisit: 1.5,
    }

    expect(buildBigNumbersRows(stats)).toEqual([
      { label: 'Sessions played', value: '4' },
      { label: 'Avg hits / visit', value: '1.5' },
    ])
  })
})
