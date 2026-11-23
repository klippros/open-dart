import { describe, expect, it } from 'vitest'
import { NinetyNineDartsStatGroup } from '@open-dart/analytics/ninetyNineVisitStats'
import { JdcChallengeGrade } from '@open-dart/game/types/jdcChallenge'
import {
  buildBigNumbersSummaryCards,
  buildBob27SummaryCards,
  buildHunterSummaryCards,
  buildJdcChallengeSegmentCards,
  buildJdcChallengeSummaryCards,
  buildNinetyNineDartsHitCards,
  buildNinetyNineDartsSummaryCards,
  buildX01SummaryCards,
  emptyNinetyNineDartsGroup,
} from './profileCards'

const labels = (cards: { label: string }[]) => cards.map((card) => card.label)

describe('profileCards', () => {
  it('builds the x01 summary with paired best leg darts', () => {
    const cards = buildX01SummaryCards(
      {
        legCount: 12,
        threeDartAverage: 61.234,
        avgDarts: 21.5,
        threeDartAverageUntil170: 64.1,
        checkoutPercent: 33.4,
        bestLegAverage: 83.5,
        bestLegDarts: 18,
      },
      { scope: { type: 'x01-501-online' }, scopeLabel: '501 online' },
    )

    expect(labels(cards)).toEqual(['Legs', 'Average', 'To 170', 'Checkouts', 'Best Leg'])
    expect(cards[0]?.value).toBe('12')
    expect(cards[1]?.value).toBe('61.23')
    expect(cards[1]?.details[0]?.text).toBe('21.5 darts')
    expect(cards[1]?.details[0]?.timeline?.metric).toBe('avgDarts')
    expect(cards[3]?.value).toBe('33%')
    expect(cards[4]?.details[0]?.text).toBe('18 darts')
    expect(cards[4]?.timeline?.scope).toEqual({ type: 'x01-501-online' })
  })

  it('shows dashes for an empty x01 section', () => {
    const cards = buildX01SummaryCards(
      {
        legCount: 0,
        threeDartAverage: null,
        avgDarts: null,
        threeDartAverageUntil170: null,
        checkoutPercent: null,
        bestLegAverage: null,
        bestLegDarts: null,
      },
      { scope: { type: 'x01-501' }, scopeLabel: '501' },
    )

    expect(cards.map((card) => card.value)).toEqual(['—', '—', '—', '—', '—'])
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

    expect(labels(cards)).toEqual(['Sessions', 'Score', 'Shanghais', 'High Score'])
    expect(cards[1]?.grade).not.toBeNull()
    expect(Object.values(JdcChallengeGrade)).toContain(cards[3]?.grade)
    expect(labels(buildJdcChallengeSegmentCards(input))).toEqual([
      'Shanghai 10–15',
      'Doubles',
      'Shanghai 15–20',
    ])
  })

  it('uses trebles copy for 99 Darts and blanks trebles on bull', () => {
    const twenty = {
      ...emptyNinetyNineDartsGroup(NinetyNineDartsStatGroup.Twenty),
      sessionCount: 2,
      avgTrebles: 4,
    }
    expect(labels(buildNinetyNineDartsSummaryCards(twenty))).toEqual([
      'Sessions',
      'Score',
      'Hit Rate',
      'Trebles',
    ])

    const bull = buildNinetyNineDartsHitCards({
      ...emptyNinetyNineDartsGroup(NinetyNineDartsStatGroup.Bull),
      avgTrebles: 3,
    })
    expect(labels(bull)).toEqual(['Singles', 'Doubles', 'Trebles'])
    expect(bull[2]?.value).toBe('—')
    expect(bull[2]?.timeline).toBeNull()
  })

  it('pools Big Numbers and keeps Hunter labels', () => {
    expect(
      labels(buildBigNumbersSummaryCards({ sessionCount: 1, hitRate: 50, bestHitRate: 75 })),
    ).toEqual(['Sessions', 'Hit Rate', 'Best Hit Rate'])
    expect(
      buildBigNumbersSummaryCards({ sessionCount: 1, hitRate: 50, bestHitRate: 75 })[1]?.timeline
        ?.scope,
    ).toEqual({ type: 'practice-big-numbers' })
    expect(
      labels(
        buildHunterSummaryCards({ sessionCount: 0, avgAdvancesPerVisit: null, hitRate: null }),
      ),
    ).toEqual(['Sessions', 'Advances/Visit', 'Hit Rate'])
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

    expect(labels(cards)).toEqual(['Sessions', 'Score', 'Hit Rate', 'High Score'])
    expect(cards[2]?.details.map((detail) => detail.timeline?.metric)).toEqual([
      'avgHitsPerVisit',
      'avgDoublesPerGame',
    ])
    expect(cards[3]?.details.map((detail) => detail.text)).toEqual([
      '1.80 best / visit',
      '12 best doubles / game',
    ])
  })
})
