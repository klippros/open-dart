import type {
  AroundTheClockPracticeStats,
  BullRunPracticeStats,
  CheckoutPracticeStats,
  ClaimTheBoardPracticeStats,
} from '@open-dart/analytics/computeAnalytics'
import type { X01LegStats } from '@open-dart/analytics/x01Stats'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import { getJdcChallengeGrade } from '@open-dart/game/jdcChallenge/jdcChallengeRules'
import type { JdcChallengeGrade } from '@open-dart/game/types/jdcChallenge'
import {
  formatAverage,
  formatCheckoutPercent,
  formatInteger,
  formatPercent,
  getDoubleCheckoutRate,
} from '../analytics/formatAnalytics'
import type {
  StatMetricId,
  StatTimelineScope,
  StatTimelineSecondaryMetric,
  StatTimelineSelection,
} from '../analytics/statTimelines'

export interface ProfileBestSource {
  sessionId: string
  legNumber: number | null
}

export interface ProfileStatDetail {
  id: string
  text: string
  timeline: StatTimelineSelection | null
  /** Own-profile session behind a Best line. Absent on other players' profiles. */
  source?: ProfileBestSource | null
}

export const sessionBestSource = (
  sessionId: string | null | undefined,
): ProfileBestSource | null =>
  sessionId === null || sessionId === undefined ? null : { sessionId, legNumber: null }

export interface ProfileStatCardModel {
  id: string
  label: string
  value: string
  details: ProfileStatDetail[]
  timeline: StatTimelineSelection | null
  grade: JdcChallengeGrade | null
}

export interface ProfileTimelineContext {
  scope: StatTimelineScope
  scopeLabel: string
  checkedOutOnly?: boolean
}

const selection = (
  context: ProfileTimelineContext,
  metric: StatMetricId,
  metricLabel: string,
  secondary?: readonly StatTimelineSecondaryMetric[],
): StatTimelineSelection => ({
  scope: context.scope,
  scopeLabel: context.scopeLabel,
  metric,
  metricLabel,
  ...(context.checkedOutOnly === true ? { checkedOutOnly: true } : {}),
  ...(secondary === undefined ? {} : { secondary }),
})

const formatBob27Subline = (
  perVisit: number | null,
  perGame: number | null,
  perGameDigits: number,
): string => `${formatAverage(perVisit)} Visit / ${formatAverage(perGame, perGameDigits)} Game`

const card = (
  id: string,
  label: string,
  value: string,
  options: {
    timeline?: StatTimelineSelection | null
    details?: ProfileStatDetail[]
    grade?: JdcChallengeGrade | null
  } = {},
): ProfileStatCardModel => ({
  id,
  label,
  value,
  details: options.details ?? [],
  timeline: options.timeline ?? null,
  grade: options.grade ?? null,
})

const bestDetail = (
  value: string | null,
  source: ProfileBestSource | null = null,
): ProfileStatDetail[] =>
  value === null ? [] : [{ id: 'best', text: `Best ${value}`, timeline: null, source }]

const formatRate = (rate: number | null): string => formatPercent(rate, 1)

const formatPerGame = (value: number | null): string => formatAverage(value, 1)

const gradeFor = (score: number | null): JdcChallengeGrade | null =>
  score === null ? null : getJdcChallengeGrade(score)

/* x01 ------------------------------------------------------------------ */

export interface X01SummaryInput {
  legCount: number
  threeDartAverage: number | null
  avgDarts: number | null
  bestDarts: number | null
  threeDartAverageUntil170: number | null
  checkoutPercent: number | null
  bestLegAverage: number | null
  bestLegSource?: ProfileBestSource | null
  bestDartsSource?: ProfileBestSource | null
}

export const x01SummaryFromLegStats = (stats: X01LegStats): X01SummaryInput => ({
  legCount: stats.legCount,
  threeDartAverage: stats.threeDartAverage,
  avgDarts: stats.avgDarts,
  bestDarts: stats.bestDarts,
  threeDartAverageUntil170: stats.threeDartAverageUntil170,
  checkoutPercent: stats.doubleCheckoutUnavailable
    ? null
    : getDoubleCheckoutRate(stats.doubleCheckout),
  bestLegAverage: stats.bestLegAverage,
  bestLegSource: stats.bestLegSource,
  bestDartsSource: stats.bestDartsSource,
})

const averageDartsSelection = (context: ProfileTimelineContext): StatTimelineSelection => ({
  ...selection(context, 'avgDarts', 'Darts'),
  checkedOutOnly: true,
})

export const buildX01SummaryCards = (
  input: X01SummaryInput,
  context: ProfileTimelineContext,
): ProfileStatCardModel[] => [
  card('average', 'Average', formatAverage(input.threeDartAverage), {
    timeline: selection(context, 'threeDartAverage', 'Average'),
    details: bestDetail(
      input.bestLegAverage === null ? null : formatAverage(input.bestLegAverage),
      input.bestLegSource ?? null,
    ),
  }),
  card('avg-darts', 'Darts', formatAverage(input.avgDarts, 1), {
    timeline: averageDartsSelection(context),
    details: bestDetail(
      input.bestDarts === null ? null : formatInteger(input.bestDarts),
      input.bestDartsSource ?? null,
    ),
  }),
  card('to-170', 'Avg to 170', formatAverage(input.threeDartAverageUntil170), {
    timeline: selection(context, 'threeDartAverageUntil170', 'Avg to 170'),
  }),
  card('checkouts', 'Checkouts', formatCheckoutPercent(input.checkoutPercent), {
    timeline: selection(context, 'doubleCheckoutRate', 'Checkouts'),
  }),
]

export interface X01DetailInput {
  legWinRate: number | null
  dartsThrown: number
  highestVisit: number | null
  thrown180: number
  thrown140Plus: number
  thrown100Plus: number
  threeDartAverageUntilDouble: number | null
  checkouts100Plus: number
  highestCheckout: number | null
}

export const buildX01DetailRows = (
  stats: X01DetailInput,
  context: ProfileTimelineContext,
): ProfileStatCardModel[] => [
  card('leg-win-rate', 'Leg win rate', formatRate(stats.legWinRate)),
  card('darts-thrown', 'Darts thrown', formatInteger(stats.dartsThrown)),
  card('highest-visit', 'Highest visit', formatInteger(stats.highestVisit), {
    timeline: selection(context, 'highestVisit', 'Highest visit'),
  }),
  card('180s', '180s', formatInteger(stats.thrown180), {
    timeline: selection(context, 'thrown180', '180s'),
  }),
  card('140-plus', '140+', formatInteger(stats.thrown140Plus), {
    timeline: selection(context, 'thrown140Plus', '140+'),
  }),
  card('100-plus', '100+', formatInteger(stats.thrown100Plus), {
    timeline: selection(context, 'thrown100Plus', '100+'),
  }),
  card('avg-to-double', 'Avg to double', formatAverage(stats.threeDartAverageUntilDouble), {
    timeline: selection(context, 'threeDartAverageUntilDouble', 'Avg to double'),
  }),
  card('checkouts-100-plus', 'Checkouts 100+', formatInteger(stats.checkouts100Plus), {
    timeline: selection(context, 'checkouts100Plus', 'Checkouts 100+'),
  }),
  card('highest-checkout', 'Highest checkout', formatInteger(stats.highestCheckout), {
    timeline: selection(context, 'highestCheckout', 'Highest checkout'),
  }),
]

/* JDC Challenge ---------------------------------------------------------- */

export interface JdcChallengeSummaryInput {
  sessionCount: number
  avgScore: number | null
  avgShanghais: number | null
  bestScore: number | null
  avgShanghaiLowScore: number | null
  avgDoublesScore: number | null
  avgShanghaiHighScore: number | null
  bestScoreSource?: ProfileBestSource | null
}

const JDC_CONTEXT: ProfileTimelineContext = {
  scope: { type: 'practice-jdc-challenge' },
  scopeLabel: 'JDC Challenge',
}

export const buildJdcChallengeSummaryCards = (
  input: JdcChallengeSummaryInput,
): ProfileStatCardModel[] => [
  card('score', 'Score', formatInteger(input.avgScore), {
    timeline: selection(JDC_CONTEXT, 'avgFinalScore', 'Score'),
    grade: gradeFor(input.avgScore),
    details: bestDetail(
      input.bestScore === null ? null : formatInteger(input.bestScore),
      input.bestScoreSource ?? null,
    ),
  }),
  card('shanghais', 'Shanghais', formatPerGame(input.avgShanghais), {
    timeline: selection(JDC_CONTEXT, 'avgShanghaisPerGame', 'Shanghais'),
  }),
]

export const buildJdcChallengeSegmentCards = (
  input: JdcChallengeSummaryInput,
): ProfileStatCardModel[] => [
  card('shanghai-low', '10–15', formatInteger(input.avgShanghaiLowScore), {
    timeline: selection(JDC_CONTEXT, 'avgShanghaiLowScore', '10–15'),
  }),
  card('doubles', 'Doubles', formatInteger(input.avgDoublesScore), {
    timeline: selection(JDC_CONTEXT, 'avgDoublesScore', 'Doubles'),
  }),
  card('shanghai-high', '15–20', formatInteger(input.avgShanghaiHighScore), {
    timeline: selection(JDC_CONTEXT, 'avgShanghaiHighScore', '15–20'),
  }),
]

/* 99 Darts ---------------------------------------------------------------- */

export interface NinetyNineDartsGroupInput {
  group: NinetyNineDartsStatGroup
  sessionCount: number
  avgScore: number | null
  bestScore: number | null
  hitRate: number | null
  avgSingles: number | null
  avgDoubles: number | null
  avgTrebles: number | null
  bestScoreSource?: ProfileBestSource | null
}

export const NINETY_NINE_DARTS_GROUPS: readonly NinetyNineDartsStatGroup[] = [
  NinetyNineDartsStatGroup.Twenty,
  NinetyNineDartsStatGroup.Bull,
  NinetyNineDartsStatGroup.Other,
]

export const emptyNinetyNineDartsGroup = (
  group: NinetyNineDartsStatGroup,
): NinetyNineDartsGroupInput => ({
  group,
  sessionCount: 0,
  avgScore: null,
  bestScore: null,
  hitRate: null,
  avgSingles: null,
  avgDoubles: null,
  avgTrebles: null,
})

const ninetyNineContext = (group: NinetyNineDartsStatGroup): ProfileTimelineContext => ({
  scope: { type: 'practice-99-darts', group },
  scopeLabel: `99 Darts · ${getNinetyNineDartsGroupLabel(group)}`,
})

export const getNinetyNineDartsGroupLabel = (group: NinetyNineDartsStatGroup): string => {
  switch (group) {
    case NinetyNineDartsStatGroup.Twenty:
      return '20'
    case NinetyNineDartsStatGroup.Bull:
      return 'Bull'
    case NinetyNineDartsStatGroup.Other:
      return 'Other'
    default:
      return 'Other'
  }
}

const ninetyNineTreblesCard = (
  input: NinetyNineDartsGroupInput,
  context: ProfileTimelineContext,
): ProfileStatCardModel | null => {
  if (input.group === NinetyNineDartsStatGroup.Bull) {
    return null
  }

  return card('trebles', 'Trebles', formatPerGame(input.avgTrebles), {
    timeline: selection(context, 'avgTreblesPerGame', 'Trebles / game'),
  })
}

export const buildNinetyNineDartsSummaryCards = (
  input: NinetyNineDartsGroupInput,
): ProfileStatCardModel[] => {
  const context = ninetyNineContext(input.group)
  const trebles = ninetyNineTreblesCard(input, context)

  return [
    card('score', 'Score', formatInteger(input.avgScore), {
      timeline: selection(context, 'avgFinalScore', 'Score'),
      details: bestDetail(
        input.bestScore === null ? null : formatInteger(input.bestScore),
        input.bestScoreSource ?? null,
      ),
    }),
    card('hit-rate', 'Hit Rate', formatRate(input.hitRate), {
      timeline: selection(context, 'hitRate', 'Hit rate'),
    }),
    ...(trebles === null ? [] : [trebles]),
  ]
}

export const buildNinetyNineDartsHitCards = (
  input: NinetyNineDartsGroupInput,
): ProfileStatCardModel[] => {
  const context = ninetyNineContext(input.group)

  return [
    card('singles', 'Singles', formatPerGame(input.avgSingles), {
      timeline: selection(context, 'avgSinglesPerGame', 'Singles / game'),
    }),
    card('doubles', 'Doubles', formatPerGame(input.avgDoubles), {
      timeline: selection(context, 'avgDoublesPerGame', 'Doubles / game'),
    }),
  ]
}

/* Big Numbers ------------------------------------------------------------- */

export interface BigNumbersSummaryInput {
  sessionCount: number
  hitRate: number | null
  bestHitRate: number | null
  bestHitRateSource?: ProfileBestSource | null
}

const BIG_NUMBERS_CONTEXT: ProfileTimelineContext = {
  scope: { type: 'practice-big-numbers' },
  scopeLabel: 'Big Numbers',
}

export const buildBigNumbersSummaryCards = (
  input: BigNumbersSummaryInput,
): ProfileStatCardModel[] => [
  card('hit-rate', 'Hit Rate', formatRate(input.hitRate), {
    timeline: selection(BIG_NUMBERS_CONTEXT, 'hitRate', 'Hit rate'),
    details: bestDetail(
      input.bestHitRate === null ? null : formatRate(input.bestHitRate),
      input.bestHitRateSource ?? null,
    ),
  }),
]

/* Bob's 27 ---------------------------------------------------------------- */

export interface Bob27SummaryInput {
  sessionCount: number
  avgScore: number | null
  hitRate: number | null
  avgHitsPerVisit: number | null
  avgDoublesPerGame: number | null
  bestScore: number | null
  bestHitsPerVisit: number | null
  bestDoublesPerGame: number | null
  bestScoreSource?: ProfileBestSource | null
}

const BOB27_CONTEXT: ProfileTimelineContext = {
  scope: { type: 'practice-bob27' },
  scopeLabel: "Bob's 27",
}

const BOB27_SUBSTATS: readonly StatTimelineSecondaryMetric[] = [
  { metric: 'avgHitsPerVisit', suffix: ' Visit /' },
  { metric: 'avgDoublesPerGame', suffix: ' Game', digits: 1 },
]

export const buildBob27SummaryCards = (input: Bob27SummaryInput): ProfileStatCardModel[] => [
  card('score', 'Score', formatInteger(input.avgScore), {
    timeline: selection(BOB27_CONTEXT, 'avgFinalScore', 'Score'),
    details: bestDetail(
      input.bestScore === null ? null : formatInteger(input.bestScore),
      input.bestScoreSource ?? null,
    ),
  }),
  card('hit-rate', 'Hit Rate', formatRate(input.hitRate), {
    timeline: selection(BOB27_CONTEXT, 'hitRate', 'Hit rate', BOB27_SUBSTATS),
    details: [
      {
        id: 'per-visit-game',
        text: formatBob27Subline(input.avgHitsPerVisit, input.avgDoublesPerGame, 1),
        timeline: null,
      },
    ],
  }),
]

/* Own-profile extras ------------------------------------------------------ */

export interface HunterSummaryInput {
  sessionCount: number
  avgAdvancesPerVisit: number | null
  hitRate: number | null
}

const HUNTER_CONTEXT: ProfileTimelineContext = {
  scope: { type: 'practice-hunter' },
  scopeLabel: 'Hunter',
}

export const buildHunterSummaryCards = (input: HunterSummaryInput): ProfileStatCardModel[] => [
  card('advances-per-visit', 'Advances / Visit', formatAverage(input.avgAdvancesPerVisit), {
    timeline: selection(HUNTER_CONTEXT, 'avgAdvancesPerVisit', 'Advances / Visit'),
  }),
  card('hit-rate', 'Hit Rate', formatRate(input.hitRate), {
    timeline: selection(HUNTER_CONTEXT, 'hitRate', 'Hit rate'),
  }),
]

const checkoutContext = (stats: CheckoutPracticeStats): ProfileTimelineContext => ({
  scope: { type: 'practice-checkout', mode: stats.mode },
  scopeLabel: stats.label,
})

const bestCheckoutRateDetail = (stats: CheckoutPracticeStats): ProfileStatDetail[] =>
  bestDetail(
    stats.bestCheckoutRate === null ? null : formatCheckoutPercent(stats.bestCheckoutRate),
    sessionBestSource(stats.bestCheckoutRateSessionId),
  )

const bestCheckoutsPerGameDetail = (stats: CheckoutPracticeStats): ProfileStatDetail[] =>
  bestDetail(
    stats.bestCheckoutsPerGame === null ? null : formatInteger(stats.bestCheckoutsPerGame),
    sessionBestSource(stats.bestCheckoutsSessionId),
  )

export const buildOneTwentyOneCards = (stats: CheckoutPracticeStats): ProfileStatCardModel[] => {
  const context = checkoutContext(stats)

  return [
    card('checkouts', 'Checkouts', formatCheckoutPercent(stats.checkoutRate), {
      timeline: selection(context, 'checkoutRate', 'Checkouts'),
      details: bestCheckoutRateDetail(stats),
    }),
    card('average', '3 dart Avg', formatAverage(stats.threeDartAverage), {
      timeline: selection(context, 'threeDartAverage', '3 dart Avg'),
      details: bestDetail(
        stats.bestThreeDartAverage === null ? null : formatAverage(stats.bestThreeDartAverage),
        sessionBestSource(stats.bestThreeDartAverageSessionId),
      ),
    }),
    card('avg-per-game', 'Checkouts / Game', formatAverage(stats.avgCheckoutsPerGame), {
      timeline: selection(context, 'avgCheckoutsPerGame', 'Checkouts / Game'),
      details: bestCheckoutsPerGameDetail(stats),
    }),
    card('highest', 'Highest', formatInteger(stats.highestCheckout), {
      timeline: selection(context, 'highestCheckout', 'Highest checkout'),
    }),
  ]
}

export const buildTenUpOneDownCards = (stats: CheckoutPracticeStats): ProfileStatCardModel[] => {
  const context = checkoutContext(stats)

  return [
    card('checkouts', 'Checkouts', formatCheckoutPercent(stats.checkoutRate), {
      timeline: selection(context, 'checkoutRate', 'Checkouts'),
      details: bestCheckoutRateDetail(stats),
    }),
    card('avg-checkouts', 'Checkouts / Game', formatAverage(stats.avgCheckoutsPerGame), {
      timeline: selection(context, 'avgCheckoutsPerGame', 'Checkouts / Game'),
      details: bestCheckoutsPerGameDetail(stats),
    }),
    card('highest-checkout', 'Highest Checkout', formatInteger(stats.highestCheckout), {
      timeline: selection(context, 'highestCheckout', 'Highest checkout'),
    }),
  ]
}

export const buildClaimTheBoardCards = (
  stats: ClaimTheBoardPracticeStats,
): ProfileStatCardModel[] => [
  card('score', 'Score', formatInteger(stats.avgFinalScore)),
  card('hits-per-visit', 'Hits / Visit', formatAverage(stats.avgHitsPerVisit)),
  card('fields', 'Fields', formatPerGame(stats.avgFieldsClaimedPerGame)),
  card('one-hit', '1 hit', formatPerGame(stats.avgFieldsHitOncePerGame)),
  card('two-hits', '2 hits', formatPerGame(stats.avgFieldsHitTwicePerGame)),
  card('three-hits', '3 hits', formatPerGame(stats.avgFieldsHitThricePerGame)),
]

export const buildAroundTheClockCards = (
  stats: AroundTheClockPracticeStats,
): ProfileStatCardModel[] => {
  const context: ProfileTimelineContext = {
    scope: { type: 'practice-around-the-clock', aimMode: stats.aimMode },
    scopeLabel: stats.label,
  }

  return [
    card('score', 'Score', formatAverage(stats.avgDartsFullRun, 1), {
      timeline: selection(context, 'avgDarts', 'Darts to finish'),
      details: bestDetail(
        stats.bestDartsFullRun === null ? null : formatInteger(stats.bestDartsFullRun),
        sessionBestSource(stats.bestDartsSessionId),
      ),
    }),
    card('dart-per-target', 'Darts / Target', formatAverage(stats.avgDartsPerField, 1), {
      timeline: selection(context, 'avgDartsPerField', 'Darts / Target'),
      details: bestDetail(
        stats.bestDartsPerField === null ? null : formatAverage(stats.bestDartsPerField, 1),
        sessionBestSource(stats.bestDartsPerFieldSessionId),
      ),
    }),
  ]
}

export const buildBullRunCards = (stats: BullRunPracticeStats): ProfileStatCardModel[] => {
  const context: ProfileTimelineContext = {
    scope: { type: 'practice-bull-run' },
    scopeLabel: stats.label,
  }

  return [
    card('average', 'Average', formatAverage(stats.avgPerThreeDarts), {
      timeline: selection(context, 'avgPerThreeDarts', 'Average'),
    }),
    card('singles', 'Singles', formatAverage(stats.singlesPerThreeDarts), {
      timeline: selection(context, 'singlesPerThreeDarts', 'Singles / 3 darts'),
    }),
    card('doubles', 'Doubles', formatAverage(stats.doublesPerThreeDarts), {
      timeline: selection(context, 'doublesPerThreeDarts', 'Doubles / 3 darts'),
    }),
    card('hit-rate', 'Hit Rate', formatRate(stats.hitRate), {
      timeline: selection(context, 'hitRate', 'Hit rate'),
    }),
  ]
}
