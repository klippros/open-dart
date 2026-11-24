import { describe, expect, it } from 'vitest'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import { AroundTheClockAimMode } from '@open-dart/game/types/aroundTheClock'
import { GameModeId } from '@open-dart/game/types/gameMode'
import { JdcChallengeGrade } from '@open-dart/game/types/jdcChallenge'
import {
  buildAroundTheClockCards,
  buildBigNumbersSummaryCards,
  buildBob27SummaryCards,
  buildHunterSummaryCards,
  buildJdcChallengeSegmentCards,
  buildJdcChallengeSummaryCards,
  buildClaimTheBoardCards,
  buildNinetyNineDartsHitCards,
  buildNinetyNineDartsSummaryCards,
  buildOneTwentyOneCards,
  buildTenUpOneDownCards,
  buildX01SummaryCards,
  emptyNinetyNineDartsGroup,
} from './profileCards'

const labels = (cards: { label: string }[]) => cards.map((card) => card.label)

describe('profileCards', () => {
  it('builds the x01 summary with checkout-only average darts', () => {
    const cards = buildX01SummaryCards(
      {
        legCount: 12,
        threeDartAverage: 61.234,
        avgDarts: 21.5,
        bestDarts: 15,
        threeDartAverageUntil170: 64.1,
        checkoutPercent: 33.4,
        bestLegAverage: 83.5,
        bestLegSource: { sessionId: 'hot-leg', legNumber: 1 },
        bestDartsSource: { sessionId: 'checkout-leg', legNumber: 2 },
      },
      { scope: { type: 'x01-501-online' }, scopeLabel: '501 online' },
    )

    expect(labels(cards)).toEqual(['Average', 'Darts', 'Avg to 170', 'Checkouts'])
    expect(cards[0]?.value).toBe('61.23')
    expect(cards[0]?.details[0]?.text).toBe('Best 83.50')
    expect(cards[0]?.details[0]?.source).toEqual({ sessionId: 'hot-leg', legNumber: 1 })
    expect(cards[1]?.details[0]?.source).toEqual({ sessionId: 'checkout-leg', legNumber: 2 })
    expect(cards[0]?.timeline?.scope).toEqual({ type: 'x01-501-online' })
    expect(cards[1]?.value).toBe('21.5')
    expect(cards[1]?.details[0]?.text).toBe('Best 15')
    expect(cards[1]?.timeline).toMatchObject({
      metric: 'avgDarts',
      checkedOutOnly: true,
      scope: { type: 'x01-501-online' },
    })
    expect(cards[3]?.value).toBe('33%')
  })

  it('shows dashes for an empty x01 section', () => {
    const cards = buildX01SummaryCards(
      {
        legCount: 0,
        threeDartAverage: null,
        avgDarts: null,
        bestDarts: null,
        threeDartAverageUntil170: null,
        checkoutPercent: null,
        bestLegAverage: null,
      },
      { scope: { type: 'x01-501' }, scopeLabel: '501' },
    )

    expect(cards.map((card) => card.value)).toEqual(['—', '—', '—', '—'])
    expect(cards.flatMap((card) => card.details)).toEqual([])
  })

  it('colours JDC score cards by grade', () => {
    const input = {
      sessionCount: 3,
      avgScore: 900,
      avgShanghais: 1.33,
      bestScore: 1200,
      avgShanghaiLowScore: 200,
      avgDoublesScore: 300,
      avgShanghaiHighScore: 400,
    }
    const cards = buildJdcChallengeSummaryCards(input)

    expect(labels(cards)).toEqual(['Score', 'Shanghais'])
    expect(cards[0]?.grade).not.toBeNull()
    expect(cards[0]?.details[0]?.text).toBe('Best 1200')
    expect(Object.values(JdcChallengeGrade)).toContain(cards[0]?.grade)
    expect(labels(buildJdcChallengeSegmentCards(input))).toEqual(['10–15', 'Doubles', '15–20'])
  })

  it('uses trebles copy for 99 Darts and omits trebles on bull', () => {
    const twenty = {
      ...emptyNinetyNineDartsGroup(NinetyNineDartsStatGroup.Twenty),
      sessionCount: 2,
      avgTrebles: 4,
    }
    expect(labels(buildNinetyNineDartsSummaryCards(twenty))).toEqual([
      'Score',
      'Hit Rate',
      'Trebles',
    ])
    expect(labels(buildNinetyNineDartsHitCards(twenty))).toEqual(['Singles', 'Doubles'])

    const bull = {
      ...emptyNinetyNineDartsGroup(NinetyNineDartsStatGroup.Bull),
      avgScore: 110,
      bestScore: 110,
      avgTrebles: 3,
    }
    expect(labels(buildNinetyNineDartsSummaryCards(bull))).toEqual(['Score', 'Hit Rate'])
    expect(buildNinetyNineDartsSummaryCards(bull)[0]?.details[0]?.text).toBe('Best 110')
    expect(buildNinetyNineDartsSummaryCards(bull)[0]?.timeline?.scope).toEqual({
      type: 'practice-99-darts',
      group: NinetyNineDartsStatGroup.Bull,
    })
    expect(labels(buildNinetyNineDartsHitCards(bull))).toEqual(['Singles', 'Doubles'])
  })

  it('pools Big Numbers and keeps Hunter labels', () => {
    const bigNumbers = buildBigNumbersSummaryCards({
      sessionCount: 1,
      hitRate: 50,
      bestHitRate: 75,
    })
    expect(labels(bigNumbers)).toEqual(['Hit Rate'])
    expect(bigNumbers[0]?.details[0]?.text).toBe('Best 75.0%')
    expect(bigNumbers[0]?.timeline?.scope).toEqual({ type: 'practice-big-numbers' })
    expect(
      labels(
        buildHunterSummaryCards({ sessionCount: 0, avgAdvancesPerVisit: null, hitRate: null }),
      ),
    ).toEqual(['Advances / Visit', 'Hit Rate'])
  })

  it("gives Bob's 27 detail lines their own graphs", () => {
    const cards = buildBob27SummaryCards({
      sessionCount: 4,
      avgScore: 120,
      hitRate: 40,
      avgHitsPerVisit: 1.2,
      avgDoublesPerGame: 8.5,
      bestScore: 300,
      bestHitsPerVisit: 1.8,
      bestDoublesPerGame: 12,
    })

    expect(labels(cards)).toEqual(['Score', 'Hit Rate'])
    expect(cards[0]?.details.map((detail) => detail.text)).toEqual(['Best 300'])
    expect(cards[0]?.timeline?.secondary).toBeUndefined()
    expect(cards[1]?.details.map((detail) => detail.text)).toEqual(['1.20 Visit / 8.5 Game'])
    expect(cards[1]?.details[0]?.timeline).toBeNull()
    expect(cards[1]?.timeline?.secondary?.map((metric) => metric.metric)).toEqual([
      'avgHitsPerVisit',
      'avgDoublesPerGame',
    ])
  })

  it('puts the best checkout count on the average checkout card', () => {
    const stats = {
      gameCount: 2,
      visitCount: 6,
      checkoutRate: 40,
      bestCheckoutRate: 80,
      bestCheckoutRateSessionId: 'hot-checkouts',
      threeDartAverage: 50,
      bestThreeDartAverage: 62.5,
      bestThreeDartAverageSessionId: 'hot-average',
      avgCheckoutsPerGame: 1.5,
      bestCheckoutsPerGame: 3,
      highestCheckout: 80,
      lastPlayedAt: '2026-01-01T00:00:00.000Z',
    }

    const oneTwentyOne = buildOneTwentyOneCards({
      ...stats,
      mode: GameModeId.OneTwentyOne,
      label: '121',
    })
    const tenUp = buildTenUpOneDownCards({
      ...stats,
      mode: GameModeId.TenUpOneDown,
      label: '10 Up 1 Down',
    })

    expect(labels(oneTwentyOne)).toEqual(['Checkouts', '3 dart Avg', 'Checkouts / Game', 'Highest'])
    expect(oneTwentyOne[0]?.details[0]?.text).toBe('Best 80%')
    expect(oneTwentyOne[0]?.details[0]?.source).toEqual({
      sessionId: 'hot-checkouts',
      legNumber: null,
    })
    expect(oneTwentyOne[1]?.details[0]?.text).toBe('Best 62.50')
    expect(oneTwentyOne[1]?.details[0]?.source).toEqual({
      sessionId: 'hot-average',
      legNumber: null,
    })
    expect(oneTwentyOne[2]?.details[0]?.text).toBe('Best 3')
    expect(labels(tenUp)).toEqual(['Checkouts', 'Checkouts / Game', 'Highest Checkout'])
    expect(tenUp[0]?.details[0]?.text).toBe('Best 80%')
    expect(tenUp[1]?.details[0]?.text).toBe('Best 3')
  })

  it('adds darts per target beside the around the clock score', () => {
    const cards = buildAroundTheClockCards({
      mode: GameModeId.AroundTheClock,
      aimMode: AroundTheClockAimMode.Singles,
      label: 'Around the Clock · Singles',
      gameCount: 2,
      completedCount: 1,
      completionRate: 50,
      avgDartsFullRun: 12,
      bestDartsFullRun: 12,
      bestDartsSessionId: 'full-run',
      avgDartsPerField: 3.25,
      bestDartsPerField: 2.04,
      bestDartsPerFieldSessionId: 'efficient',
      targets: [],
      lastPlayedAt: '2026-01-01T00:00:00.000Z',
    })

    expect(labels(cards)).toEqual(['Score', 'Darts / Target'])
    expect(cards[1]?.value).toBe('3.3')
    expect(cards[1]?.details[0]?.text).toBe('Best 2.0')
    expect(cards[1]?.details[0]?.source).toEqual({ sessionId: 'efficient', legNumber: null })
    expect(cards[1]?.timeline?.metric).toBe('avgDartsPerField')
  })

  it('orders Claim the Board as two rows of three', () => {
    const cards = buildClaimTheBoardCards({
      mode: GameModeId.ClaimTheBoard,
      label: 'Claim the Board',
      gameCount: 1,
      avgHitsPerVisit: 1,
      avgFieldsClaimedPerGame: 2,
      avgFieldsHitOncePerGame: 3,
      avgFieldsHitTwicePerGame: 4,
      avgFieldsHitThricePerGame: 5,
      avgFinalScore: 6,
    })

    expect(labels(cards)).toEqual(['Score', 'Hits / Visit', 'Fields', '1 hit', '2 hits', '3 hits'])
  })
})
