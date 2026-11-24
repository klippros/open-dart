import type { GameSession } from '@open-dart/game/types/gameSession.ts'
import { isX01Config } from '@open-dart/game/game/gameConfigGuards.ts'
import { x01PresetConfigs, X01PresetId } from '@open-dart/game/x01/x01Presets.ts'
import {
  countDoubleCheckoutStatsOmittingUnresolvedLegs,
  mergeDoubleCheckoutStats,
  emptyDoubleCheckoutStats,
} from './doubleCheckoutStats.ts'
import type { DoubleCheckoutStats } from './doubleCheckoutStats.ts'
import { getLatestSessionStartedAt } from './pickLastPlayedVariant.ts'
import {
  filterAllX01Sessions,
  filterFiveOhOneSessions,
  filterOneSeventySessions,
  filterOnlineFiveOhOneSessions,
} from './sessionScope.ts'
import {
  countCheckouts100Plus,
  countThrown100Plus,
  countThrown140Plus,
  countThrown180,
  getHighestCheckout,
  getHighestVisit,
  findBestThreeDartAverage,
  getScoringVisits,
  getThreeDartAverage,
  getVisitsBeforeDouble,
} from './visitStats.ts'
import {
  countDartsInVisits,
  expandX01SessionsLegs,
  legFinishedWithCheckout,
} from './x01LegSlices.ts'

export const FIVE_OH_ONE_START_SCORE = x01PresetConfigs[X01PresetId.FiveOhOne].startScore

export enum X01StatsFilterId {
  FiveOhOneOnline = '501-online',
  FiveOhOne = '501',
  OneSeventy = '170',
  All = 'all',
}

export interface X01StatsOptions {
  checkedOutOnly?: boolean
}

export interface X01LegStats {
  legCount: number
  checkoutLegCount: number
  threeDartAverage: number | null
  threeDartAverageUntil170: number | null
  threeDartAverageUntilDouble: number | null
  bestLegAverage: number | null
  /** Leg behind `bestLegAverage`, when one exists. */
  bestLegSource: { sessionId: string; legNumber: number } | null
  /**
   * Dart count for the same leg as `bestLegAverage`. Null when that leg did not
   * check out, so the profile can say it was not finished.
   */
  bestLegDarts: number | null
  avgDarts: number | null
  /** Fewest darts among legs that checked out. Null when none did. */
  bestDarts: number | null
  /** Checked-out leg behind `bestDarts`, when one exists. */
  bestDartsSource: { sessionId: string; legNumber: number } | null
  dartsThrown: number
  /** Share of legs won (checked out) in games with an opponent; null without one. */
  legWinRate: number | null
  thrown180: number
  thrown140Plus: number
  thrown100Plus: number
  doubleCheckout: DoubleCheckoutStats
  doubleCheckoutUnavailable: boolean
  checkouts100Plus: number
  highestCheckout: number | null
  highestVisit: number | null
  lastPlayedAt: string | null
}

export interface X01Stats {
  fiveOhOneOnline: X01LegStats
  fiveOhOne: X01LegStats
  oneSeventy: X01LegStats
  all: X01LegStats
}

const emptyLegStats = (): X01LegStats => ({
  legCount: 0,
  checkoutLegCount: 0,
  threeDartAverage: null,
  threeDartAverageUntil170: null,
  threeDartAverageUntilDouble: null,
  bestLegAverage: null,
  bestLegSource: null,
  bestLegDarts: null,
  avgDarts: null,
  bestDarts: null,
  bestDartsSource: null,
  dartsThrown: 0,
  legWinRate: null,
  thrown180: 0,
  thrown140Plus: 0,
  thrown100Plus: 0,
  doubleCheckout: emptyDoubleCheckoutStats(),
  doubleCheckoutUnavailable: false,
  checkouts100Plus: 0,
  highestCheckout: null,
  highestVisit: null,
  lastPlayedAt: null,
})

const isDoubleOutLeg = (leg: { session: GameSession }): boolean =>
  isX01Config(leg.session.mode, leg.session.config) && leg.session.config.doubleOut

const computeX01LegStats = (
  sessions: GameSession[],
  options: X01StatsOptions = {},
): X01LegStats => {
  const expandedLegs = expandX01SessionsLegs(sessions)
  const legs =
    options.checkedOutOnly === true
      ? expandedLegs.filter((leg) => legFinishedWithCheckout(leg.visits))
      : expandedLegs

  if (legs.length === 0) {
    return emptyLegStats()
  }

  const allVisits = legs.flatMap((leg) => leg.visits)
  const scoringVisits = legs.flatMap((leg) => getScoringVisits(leg.visits))
  const visitsBeforeDouble = legs
    .filter(isDoubleOutLeg)
    .flatMap((leg) => getVisitsBeforeDouble(leg.visits))
  const checkoutLegs = legs.filter((leg) => legFinishedWithCheckout(leg.visits))

  let doubleCheckoutUnavailable = false
  const doubleCheckout = legs.reduce<DoubleCheckoutStats>((totals, leg) => {
    if (!isX01Config(leg.session.mode, leg.session.config)) {
      return totals
    }

    const result = countDoubleCheckoutStatsOmittingUnresolvedLegs(
      leg.visits,
      {
        doubleIn: leg.session.config.doubleIn,
        doubleOut: leg.session.config.doubleOut,
      },
      leg.session.config.doubleIn,
    )

    if (result.unavailable) {
      doubleCheckoutUnavailable = true
    }

    return mergeDoubleCheckoutStats(totals, result.stats)
  }, emptyDoubleCheckoutStats())

  const bestLeg = findBestThreeDartAverage(legs, (leg) => leg.visits)
  const bestDartsLeg = checkoutLegs.reduce<(typeof checkoutLegs)[number] | null>((best, leg) => {
    if (best === null || countDartsInVisits(leg.visits) < countDartsInVisits(best.visits)) {
      return leg
    }

    return best
  }, null)
  const contestedLegs = legs.filter((leg) => leg.session.players.length > 1)
  const contestedWins = contestedLegs.filter((leg) => legFinishedWithCheckout(leg.visits)).length

  return {
    legCount: legs.length,
    checkoutLegCount: checkoutLegs.length,
    threeDartAverage: getThreeDartAverage(allVisits),
    threeDartAverageUntil170: getThreeDartAverage(scoringVisits),
    threeDartAverageUntilDouble: getThreeDartAverage(visitsBeforeDouble),
    bestLegAverage: bestLeg?.average ?? null,
    bestLegSource:
      bestLeg === null
        ? null
        : { sessionId: bestLeg.item.session.id, legNumber: bestLeg.item.legNumber },
    bestLegDarts: bestLeg !== null && bestLeg.checkedOut ? bestLeg.darts : null,
    avgDarts:
      checkoutLegs.length === 0
        ? null
        : checkoutLegs.reduce((sum, leg) => sum + countDartsInVisits(leg.visits), 0) /
          checkoutLegs.length,
    bestDarts: bestDartsLeg === null ? null : countDartsInVisits(bestDartsLeg.visits),
    bestDartsSource:
      bestDartsLeg === null
        ? null
        : { sessionId: bestDartsLeg.session.id, legNumber: bestDartsLeg.legNumber },
    dartsThrown: countDartsInVisits(allVisits),
    legWinRate: contestedLegs.length === 0 ? null : (contestedWins / contestedLegs.length) * 100,
    thrown180: countThrown180(allVisits),
    thrown140Plus: countThrown140Plus(allVisits),
    thrown100Plus: countThrown100Plus(allVisits),
    doubleCheckout,
    doubleCheckoutUnavailable: doubleCheckout.attempts === 0 && doubleCheckoutUnavailable,
    checkouts100Plus: countCheckouts100Plus(allVisits),
    highestCheckout: getHighestCheckout(allVisits),
    highestVisit: getHighestVisit(allVisits),
    lastPlayedAt: getLatestSessionStartedAt(
      options.checkedOutOnly === true
        ? [...new Map(legs.map((leg) => [leg.session.id, leg.session])).values()]
        : sessions,
    ),
  }
}

export const computeX01Stats = (
  sessions: GameSession[],
  options: X01StatsOptions = {},
): X01Stats => ({
  fiveOhOneOnline: computeX01LegStats(filterOnlineFiveOhOneSessions(sessions), options),
  fiveOhOne: computeX01LegStats(filterFiveOhOneSessions(sessions), options),
  oneSeventy: computeX01LegStats(filterOneSeventySessions(sessions), options),
  all: computeX01LegStats(filterAllX01Sessions(sessions), options),
})
