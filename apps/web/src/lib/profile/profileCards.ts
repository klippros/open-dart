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
  StatTimelineSelection,
} from '../analytics/statTimelines'

export interface ProfileStatDetail {
  id: string
  text: string
  timeline: StatTimelineSelection | null
}

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
): StatTimelineSelection => ({
  scope: context.scope,
  scopeLabel: context.scopeLabel,
  metric,
  metricLabel,
  ...(context.checkedOutOnly === true ? { checkedOutOnly: true } : {}),
})

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

const formatSessions = (count: number): string => (count === 0 ? '—' : formatInteger(count))

const formatRate = (rate: number | null): string => formatPercent(rate, 1)

const formatPerGame = (value: number | null): string => formatAverage(value, 1)

const gradeFor = (score: number | null): JdcChallengeGrade | null =>
  score === null ? null : getJdcChallengeGrade(score)

/* x01 ------------------------------------------------------------------ */

export interface X01SummaryInput {
  legCount: number
  threeDartAverage: number | null
  avgDarts: number | null
  threeDartAverageUntil170: number | null
  checkoutPercent: number | null
  bestLegAverage: number | null
  bestLegDarts: number | null
}

export const x01SummaryFromLegStats = (stats: X01LegStats): X01SummaryInput => ({
  legCount: stats.legCount,
  threeDartAverage: stats.threeDartAverage,
  avgDarts: stats.avgDarts,
  threeDartAverageUntil170: stats.threeDartAverageUntil170,
  checkoutPercent: stats.doubleCheckoutUnavailable
    ? null
    : getDoubleCheckoutRate(stats.doubleCheckout),
  bestLegAverage: stats.bestLegAverage,
  bestLegDarts: stats.bestLegDarts,
})

export const buildX01SummaryCards = (
  input: X01SummaryInput,
  context: ProfileTimelineContext,
): ProfileStatCardModel[] => [
  card('legs', 'Legs', formatSessions(input.legCount)),
  card('average', 'Average', formatAverage(input.threeDartAverage), {
    timeline: selection(context, 'threeDartAverage', 'Average'),
    details:
      input.avgDarts === null
        ? []
        : [
            {
              id: 'avg-darts',
              text: `${formatAverage(input.avgDarts, 1)} darts`,
              timeline: selection(context, 'avgDarts', 'Avg darts'),
            },
          ],
  }),
  card('to-170', 'To 170', formatAverage(input.threeDartAverageUntil170), {
    timeline: selection(context, 'threeDartAverageUntil170', 'Average to 170'),
  }),
  card('checkouts', 'Checkouts', formatCheckoutPercent(input.checkoutPercent), {
    timeline: selection(context, 'doubleCheckoutRate', 'Checkouts'),
  }),
  card('best-leg', 'Best Leg', formatAverage(input.bestLegAverage), {
    timeline: selection(context, 'bestLegAverage', 'Best leg average'),
    details:
      input.bestLegDarts === null
        ? []
        : [{ id: 'best-leg-darts', text: `${input.bestLegDarts} darts`, timeline: null }],
  }),
]

export const buildX01DetailRows = (
  stats: X01LegStats,
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
}

const JDC_CONTEXT: ProfileTimelineContext = {
  scope: { type: 'practice-jdc-challenge' },
  scopeLabel: 'JDC Challenge',
}

export const buildJdcChallengeSummaryCards = (
  input: JdcChallengeSummaryInput,
): ProfileStatCardModel[] => [
  card('sessions', 'Sessions', formatSessions(input.sessionCount)),
  card('score', 'Score', formatInteger(input.avgScore), {
    timeline: selection(JDC_CONTEXT, 'avgFinalScore', 'Score'),
    grade: gradeFor(input.avgScore),
  }),
  card('shanghais', 'Shanghais', formatPerGame(input.avgShanghais), {
    timeline: selection(JDC_CONTEXT, 'avgShanghaisPerGame', 'Shanghais'),
  }),
  card('high-score', 'High Score', formatInteger(input.bestScore), {
    timeline: selection(JDC_CONTEXT, 'bestFinalScore', 'Score'),
    grade: gradeFor(input.bestScore),
  }),
]

export const buildJdcChallengeSegmentCards = (
  input: JdcChallengeSummaryInput,
): ProfileStatCardModel[] => [
  card('shanghai-low', 'Shanghai 10–15', formatInteger(input.avgShanghaiLowScore), {
    timeline: selection(JDC_CONTEXT, 'avgShanghaiLowScore', 'Shanghai 10–15'),
  }),
  card('doubles', 'Doubles', formatInteger(input.avgDoublesScore), {
    timeline: selection(JDC_CONTEXT, 'avgDoublesScore', 'Doubles'),
  }),
  card('shanghai-high', 'Shanghai 15–20', formatInteger(input.avgShanghaiHighScore), {
    timeline: selection(JDC_CONTEXT, 'avgShanghaiHighScore', 'Shanghai 15–20'),
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
    card('sessions', 'Sessions', formatSessions(input.sessionCount)),
    card('score', 'Score', formatInteger(input.avgScore), {
      timeline: selection(context, 'avgFinalScore', 'Score'),
    }),
    card('hit-rate', 'Hit Rate', formatRate(input.hitRate), {
      timeline: selection(context, 'hitRate', 'Hit rate'),
    }),
    ...(trebles === null ? [] : [trebles]),
    card('high-score', 'High Score', formatInteger(input.bestScore), {
      timeline: selection(context, 'bestFinalScore', 'Score'),
    }),
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
}

const BIG_NUMBERS_CONTEXT: ProfileTimelineContext = {
  scope: { type: 'practice-big-numbers' },
  scopeLabel: 'Big Numbers',
}

export const buildBigNumbersSummaryCards = (
  input: BigNumbersSummaryInput,
): ProfileStatCardModel[] => [
  card('sessions', 'Sessions', formatSessions(input.sessionCount)),
  card('hit-rate', 'Hit Rate', formatRate(input.hitRate), {
    timeline: selection(BIG_NUMBERS_CONTEXT, 'hitRate', 'Hit rate'),
  }),
  card('best-hit-rate', 'Best Hit Rate', formatRate(input.bestHitRate), {
    timeline: selection(BIG_NUMBERS_CONTEXT, 'bestHitRate', 'Hit rate'),
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
}

const BOB27_CONTEXT: ProfileTimelineContext = {
  scope: { type: 'practice-bob27' },
  scopeLabel: "Bob's 27",
}

export const buildBob27SummaryCards = (input: Bob27SummaryInput): ProfileStatCardModel[] => [
  card('sessions', 'Sessions', formatSessions(input.sessionCount)),
  card('score', 'Score', formatInteger(input.avgScore), {
    timeline: selection(BOB27_CONTEXT, 'avgFinalScore', 'Score'),
  }),
  card('hit-rate', 'Hit Rate', formatRate(input.hitRate), {
    timeline: selection(BOB27_CONTEXT, 'hitRate', 'Hit rate'),
    details: [
      {
        id: 'avg-per-visit',
        text: `${formatAverage(input.avgHitsPerVisit)} / visit`,
        timeline: selection(BOB27_CONTEXT, 'avgHitsPerVisit', 'Hits / visit'),
      },
      {
        id: 'avg-doubles',
        text: `${formatPerGame(input.avgDoublesPerGame)} doubles / game`,
        timeline: selection(BOB27_CONTEXT, 'avgDoublesPerGame', 'Doubles / game'),
      },
    ],
  }),
  card('high-score', 'High Score', formatInteger(input.bestScore), {
    timeline: selection(BOB27_CONTEXT, 'bestFinalScore', 'Score'),
    details: [
      {
        id: 'best-per-visit',
        text: `${formatAverage(input.bestHitsPerVisit)} best / visit`,
        timeline: selection(BOB27_CONTEXT, 'avgHitsPerVisit', 'Hits / visit'),
      },
      {
        id: 'best-doubles',
        text: `${formatInteger(input.bestDoublesPerGame)} best doubles / game`,
        timeline: selection(BOB27_CONTEXT, 'bestDoublesPerGame', 'Doubles / game'),
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
  card('sessions', 'Sessions', formatSessions(input.sessionCount)),
  card('advances-per-visit', 'Advances/Visit', formatAverage(input.avgAdvancesPerVisit), {
    timeline: selection(HUNTER_CONTEXT, 'avgAdvancesPerVisit', 'Advances / visit'),
  }),
  card('hit-rate', 'Hit Rate', formatRate(input.hitRate), {
    timeline: selection(HUNTER_CONTEXT, 'hitRate', 'Hit rate'),
  }),
]

const checkoutContext = (stats: CheckoutPracticeStats): ProfileTimelineContext => ({
  scope: { type: 'practice-checkout', mode: stats.mode },
  scopeLabel: stats.label,
})

export const buildOneTwentyOneCards = (stats: CheckoutPracticeStats): ProfileStatCardModel[] => {
  const context = checkoutContext(stats)

  return [
    card('checkouts', 'Checkouts', formatCheckoutPercent(stats.checkoutRate), {
      timeline: selection(context, 'checkoutRate', 'Checkouts'),
    }),
    card('average', 'Average', formatAverage(stats.threeDartAverage), {
      timeline: selection(context, 'threeDartAverage', 'Average'),
    }),
    card('avg-per-game', 'Avg / game', formatAverage(stats.avgCheckoutsPerGame), {
      timeline: selection(context, 'avgCheckoutsPerGame', 'Checkouts / game'),
    }),
    card('best-per-game', 'Best / game', formatInteger(stats.bestCheckoutsPerGame), {
      timeline: selection(context, 'bestCheckoutsPerGame', 'Checkouts / game'),
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
    }),
    card('avg-checkouts', 'Avg Checkouts', formatAverage(stats.avgCheckoutsPerGame), {
      timeline: selection(context, 'avgCheckoutsPerGame', 'Checkouts / game'),
    }),
    card('best-checkouts', 'Best Checkouts', formatInteger(stats.bestCheckoutsPerGame), {
      timeline: selection(context, 'bestCheckoutsPerGame', 'Checkouts / game'),
    }),
    card('highest-checkout', 'Highest Checkout', formatInteger(stats.highestCheckout), {
      timeline: selection(context, 'highestCheckout', 'Highest checkout'),
    }),
  ]
}

export const buildClaimTheBoardCards = (
  stats: ClaimTheBoardPracticeStats,
): ProfileStatCardModel[] => [
  card('hits-per-visit', 'Hits / visit', formatAverage(stats.avgHitsPerVisit)),
  card('fields', 'Fields', formatPerGame(stats.avgFieldsClaimedPerGame)),
  card('one-hit', '1 hit', formatPerGame(stats.avgFieldsHitOncePerGame)),
  card('two-hits', '2 hits', formatPerGame(stats.avgFieldsHitTwicePerGame)),
  card('three-hits', '3 hits', formatPerGame(stats.avgFieldsHitThricePerGame)),
  card('score', 'Score', formatInteger(stats.avgFinalScore)),
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
    }),
    card('high-score', 'High Score', formatInteger(stats.bestDartsFullRun), {
      timeline: selection(context, 'bestDarts', 'Darts to finish'),
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
