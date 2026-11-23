import { describe, expect, it } from 'vitest'
import type { ProfileBigNumbersStats, ProfileFiveOhOneStats } from '@open-dart/analytics'
import { buildBigNumbersRows, buildFiveOhOneRows } from './formatProfileStats'

const sampleFiveOhOne = (
  overrides: Partial<ProfileFiveOhOneStats> = {},
): ProfileFiveOhOneStats => ({
  threeDartAverage: 80.5,
  threeDartAverageUntil170: 85,
  checkoutPercent: 40,
  legsPlayed: 10,
  legWinRate: 55,
  avgDarts: 18.2,
  bestLegAverage: 100,
  bestLegDarts: 15,
  ...overrides,
})

describe('buildFiveOhOneRows', () => {
  it('formats summary fields and omits null values', () => {
    const rows = buildFiveOhOneRows(sampleFiveOhOne({ legWinRate: null }))
    expect(rows.some((row) => row.label === '501 leg win rate')).toBe(false)
    expect(rows.some((row) => row.label === 'Best leg' && row.value === '100 (15 darts)')).toBe(
      true,
    )
    expect(rows.some((row) => row.label === 'Darts thrown')).toBe(false)
    expect(rows.some((row) => row.label === '180s')).toBe(false)
  })
})

describe('buildBigNumbersRows', () => {
  it('formats sessions played and hit rates', () => {
    const stats: ProfileBigNumbersStats = {
      sessionsPlayed: 4,
      hitRate: 55.5,
      bestHitRate: 80,
    }

    expect(buildBigNumbersRows(stats)).toEqual([
      { label: 'Sessions played', value: '4' },
      { label: 'Hit rate', value: '55.5%' },
      { label: 'Best hit rate', value: '80.0%' },
    ])
  })
})
