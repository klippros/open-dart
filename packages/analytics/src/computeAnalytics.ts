import type { AnalyticsFilter } from './sessionFilters.ts'
import { filterSessions } from './sessionFilters.ts'
import { computePracticeStats } from './practiceStats.ts'
import type { PracticeStats } from './practiceStats.ts'
import { computeX01Stats } from './x01Stats.ts'
import type { X01Stats } from './x01Stats.ts'

export interface AnalyticsResult {
  filter: AnalyticsFilter
  x01: X01Stats
  practice: PracticeStats
}

export const computeAnalytics = (
  sessions: Parameters<typeof filterSessions>[0],
  filter: AnalyticsFilter,
): AnalyticsResult => {
  const filtered = filterSessions(sessions, filter)

  return {
    filter,
    x01: computeX01Stats(filtered),
    practice: computePracticeStats(filtered),
  }
}

export type { X01LegStats, X01Stats } from './x01Stats.ts'
export type { CheckoutPracticeStats, OtherPracticeStats, PracticeStats } from './practiceStats.ts'
export type {
  Bob27PracticeStats,
  ClaimTheBoardPracticeStats,
  AroundTheClockPracticeStats,
  NinetyNineDartsPracticeStats,
  BullRunPracticeStats,
  BigNumbersPracticeStats,
  JdcChallengePracticeStats,
  HunterPracticeStats,
} from './practiceStats.ts'
