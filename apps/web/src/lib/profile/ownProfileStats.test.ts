import { describe, expect, it } from 'vitest'
import { computeAnalytics } from '@open-dart/analytics/computeAnalytics'
import { computeBigNumbersSummary } from '@open-dart/analytics/practiceStats'
import { GameModeId, GameStatus } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { PlayerKind } from '@open-dart/game/types/player'
import { buildOwnProfileStatsModel } from './ownProfileStats'
import { ProfileSectionId } from './profileSections'

const bullRunSession: GameSession = {
  id: 'bull-run',
  mode: GameModeId.BullRun,
  config: {},
  players: [{ id: 'p1', name: 'You', kind: PlayerKind.Human }],
  visits: [],
  status: GameStatus.Completed,
  startedAt: '2026-01-01T10:00:00.000Z',
  completedAt: new Date().toISOString(),
}

describe('buildOwnProfileStatsModel', () => {
  it('returns empty core sections without games', () => {
    const model = buildOwnProfileStatsModel(
      computeAnalytics([], { dateRange: 'all' }),
      computeBigNumbersSummary([]),
    )

    expect(model.jdcChallenge.sessionCount).toBe(0)
    expect(model.bob27.avgScore).toBeNull()
    expect(model.hunter.sessionCount).toBe(0)
    expect(model.bigNumbers.sessionCount).toBe(0)
    expect(model.ninetyNineDarts.map((group) => group.sessionCount)).toEqual([0, 0, 0])
    expect(model.playedSections.size).toBe(0)
  })

  it('marks played extras so they become visible', () => {
    const sessions = [bullRunSession]
    const model = buildOwnProfileStatsModel(
      computeAnalytics(sessions, { dateRange: 'all' }),
      computeBigNumbersSummary(sessions),
    )

    expect(model.playedSections.has(ProfileSectionId.BullRun)).toBe(true)
    expect(model.playedSections.has(ProfileSectionId.ClaimTheBoard)).toBe(false)
  })
})
