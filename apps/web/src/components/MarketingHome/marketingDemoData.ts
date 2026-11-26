import type { StatTimelinePoint } from '../../lib/analytics/statTimelines'
import { buildX01SummaryCards } from '../../lib/profile/profileCards'
import type { ProfileStatCardModel } from '../../lib/profile/profileCards'

export const MARKETING_DEMO_SESSION_COUNT = 100
export const MARKETING_DEMO_START_COUNT = 50
export const MARKETING_DEMO_ADD_MS = 420
export const MARKETING_DEMO_HOLD_MS = 2800

interface MarketingDemoSession {
  average: number
  avgTo170: number
  checkoutPercent: number
  bestLegAverage: number
  completedAt: string
  sessionLabel: string
}

const MARKETING_CARD_IDS = new Set(['average', 'to-170', 'checkouts'])

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let next = state
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const round1 = (value: number): number => Math.round(value * 10) / 10

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

const mean = (values: readonly number[]): number => {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** Deterministic 501 sessions with a gentle upward trend + noise. */
const MARKETING_DEMO_SESSIONS: readonly MarketingDemoSession[] = (() => {
  const rand = mulberry32(20261126)
  const start = Date.UTC(2025, 8, 12, 18, 0, 0)

  return Array.from({ length: MARKETING_DEMO_SESSION_COUNT }, (_, index) => {
    const t = index / (MARKETING_DEMO_SESSION_COUNT - 1)
    const trend = 52 + t * 14
    const average = round1(clamp(trend + (rand() - 0.5) * 7.5, 45, 78))
    const avgTo170 = round1(clamp(average + 3.5 + (rand() - 0.5) * 3, 48, 82))
    const checkoutPercent = Math.round(clamp(28 + t * 18 + (rand() - 0.5) * 14, 12, 68))
    const bestLegAverage = round1(clamp(average + 12 + rand() * 18, average + 8, 110))
    const completedAt = new Date(start + index * 3 * 24 * 60 * 60 * 1000)

    return {
      average,
      avgTo170,
      checkoutPercent,
      bestLegAverage,
      completedAt: completedAt.toISOString(),
      sessionLabel: `501 · ${MONTHS[completedAt.getUTCMonth()]} ${completedAt.getUTCDate()}`,
    }
  })
})()

/** Full Average timeline; slice by visible session count when animating. */
export const MARKETING_DEMO_TIMELINE_POINTS: readonly StatTimelinePoint[] =
  MARKETING_DEMO_SESSIONS.map((session, index) => ({
    sessionId: `demo-${index + 1}`,
    completedAt: session.completedAt,
    sessionLabel: session.sessionLabel,
    value: session.average,
    secondaryValues: [],
  }))

export const buildMarketingProfileStatCards = (visibleCount: number): ProfileStatCardModel[] => {
  const sessions = MARKETING_DEMO_SESSIONS.slice(0, visibleCount)
  if (sessions.length === 0) {
    return []
  }

  const threeDartAverage = round1(mean(sessions.map((session) => session.average)))
  const threeDartAverageUntil170 = round1(mean(sessions.map((session) => session.avgTo170)))
  const checkoutPercent = Math.round(mean(sessions.map((session) => session.checkoutPercent)))
  const bestLegAverage = round1(Math.max(...sessions.map((session) => session.bestLegAverage)))

  return buildX01SummaryCards(
    {
      legCount: sessions.length,
      threeDartAverage,
      avgDarts: null,
      bestDarts: null,
      threeDartAverageUntil170,
      checkoutPercent,
      bestLegAverage,
    },
    {
      scope: { type: 'x01-501' },
      scopeLabel: '501',
    },
  ).filter((card) => MARKETING_CARD_IDS.has(card.id))
}
