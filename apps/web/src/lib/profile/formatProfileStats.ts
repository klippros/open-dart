import type {
  PlayerProfileStats,
  ProfileBigNumbersStats,
  ProfileBob27Stats,
  ProfileFiveOhOneStats,
  ProfileJdcChallengeStats,
  ProfileNinetyNineDartsStats,
  ProfileStatWindow,
} from '@open-dart/analytics'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'

export interface ProfileStatRow {
  label: string
  value: string
}

const formatNumber = (value: number | null, digits = 1): string | null => {
  if (value === null) {
    return null
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(digits)
}

const formatPercent = (value: number | null): string | null => {
  if (value === null) {
    return null
  }

  return `${value.toFixed(1)}%`
}

const pushRow = (rows: ProfileStatRow[], label: string, value: string | null): void => {
  if (value !== null) {
    rows.push({ label, value })
  }
}

export const formatProfileWindowLabel = (window: ProfileStatWindow): string => {
  const format = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
  return `${format.format(new Date(window.startAt))} – ${format.format(new Date(window.endAt))}`
}

export const buildFiveOhOneRows = (stats: ProfileFiveOhOneStats): ProfileStatRow[] => {
  const rows: ProfileStatRow[] = []
  pushRow(rows, '501 legs played', formatNumber(stats.legsPlayed, 0))
  pushRow(rows, '3-dart average', formatNumber(stats.threeDartAverage))
  pushRow(rows, '3-dart average to 170', formatNumber(stats.threeDartAverageUntil170))
  pushRow(rows, 'Checkout %', formatPercent(stats.checkoutPercent))
  pushRow(rows, 'Avg darts', formatNumber(stats.avgDarts))
  if (stats.bestLegAverage !== null) {
    const darts =
      stats.bestLegDarts === null ? null : ` (${formatNumber(stats.bestLegDarts, 0)} darts)`
    pushRow(rows, 'Best leg', `${formatNumber(stats.bestLegAverage)}${darts ?? ''}`)
  }
  pushRow(rows, '501 leg win rate', formatPercent(stats.legWinRate))
  return rows
}

export const buildBob27Rows = (stats: ProfileBob27Stats): ProfileStatRow[] => {
  const rows: ProfileStatRow[] = []
  pushRow(rows, 'Sessions played', formatNumber(stats.sessionsPlayed, 0))
  pushRow(rows, 'Avg score', formatNumber(stats.avgFinalScore))
  pushRow(rows, 'Hit rate', formatPercent(stats.hitRate))
  pushRow(rows, 'Best score', formatNumber(stats.bestFinalScore, 0))
  pushRow(rows, 'Avg hits / visit', formatNumber(stats.avgHitsPerVisit))
  pushRow(rows, 'Avg doubles / game', formatNumber(stats.avgDoublesPerGame))
  pushRow(rows, 'Best hits / visit', formatNumber(stats.bestHitsPerVisit))
  pushRow(rows, 'Best doubles / game', formatNumber(stats.bestDoublesPerGame, 0))
  return rows
}

const ninetyNineGroupLabel = (group: NinetyNineDartsStatGroup): string => {
  switch (group) {
    case NinetyNineDartsStatGroup.Twenty:
      return 'on 20'
    case NinetyNineDartsStatGroup.Bull:
      return 'on bull'
    case NinetyNineDartsStatGroup.Other:
      return 'other'
    default:
      return 'other'
  }
}

export const buildNinetyNineRows = (stats: ProfileNinetyNineDartsStats): ProfileStatRow[] => {
  const rows: ProfileStatRow[] = []
  for (const group of stats.groups) {
    const suffix = ninetyNineGroupLabel(group.group)
    pushRow(rows, `Sessions ${suffix}`, formatNumber(group.sessionsPlayed, 0))
    pushRow(rows, `Avg score ${suffix}`, formatNumber(group.avgFinalScore))
    pushRow(rows, `Hit rate ${suffix}`, formatPercent(group.hitRate))
    pushRow(rows, `Avg trebles ${suffix}`, formatNumber(group.avgTreblesPerGame))
    pushRow(rows, `Avg singles ${suffix}`, formatNumber(group.avgSinglesPerGame))
    pushRow(rows, `Avg doubles ${suffix}`, formatNumber(group.avgDoublesPerGame))
  }
  return rows
}

export const buildJdcChallengeRows = (stats: ProfileJdcChallengeStats): ProfileStatRow[] => {
  const rows: ProfileStatRow[] = []
  pushRow(rows, 'Sessions played', formatNumber(stats.sessionsPlayed, 0))
  pushRow(rows, 'Avg score', formatNumber(stats.avgFinalScore))
  pushRow(rows, 'Best score', formatNumber(stats.bestFinalScore, 0))
  pushRow(rows, 'Avg Shanghais', formatNumber(stats.avgShanghaisPerGame))
  pushRow(rows, 'Avg Shanghai 10–15', formatNumber(stats.avgShanghaiLowScore))
  pushRow(rows, 'Avg doubles', formatNumber(stats.avgDoublesScore))
  pushRow(rows, 'Avg Shanghai 15–20', formatNumber(stats.avgShanghaiHighScore))
  return rows
}

export const buildBigNumbersRows = (stats: ProfileBigNumbersStats): ProfileStatRow[] => {
  const rows: ProfileStatRow[] = []
  pushRow(rows, 'Sessions played', formatNumber(stats.sessionsPlayed, 0))
  pushRow(rows, 'Hit rate', formatPercent(stats.hitRate))
  pushRow(rows, 'Best hit rate', formatPercent(stats.bestHitRate))
  return rows
}

export const profileHasAnyStats = (stats: PlayerProfileStats): boolean =>
  stats.fiveOhOne !== null ||
  stats.bob27 !== null ||
  stats.ninetyNineDarts !== null ||
  stats.bigNumbers !== null ||
  stats.jdcChallenge !== null
