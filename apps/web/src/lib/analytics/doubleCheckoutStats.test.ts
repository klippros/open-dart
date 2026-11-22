import { describe, expect, it } from 'vitest'
import { DartMultiplier } from '@open-dart/game/types/dart'
import type { DartThrow } from '@open-dart/game/types/dart'
import type { Visit } from '@open-dart/game/types/visit'
import { VisitInputMode } from '@open-dart/game/types/visit'
import { bullDart, missDart, numberDart, outerBullDart } from '@open-dart/game/testHelpers'
import {
  countDoubleCheckoutStats,
  countDoubleCheckoutStatsForVisit,
  countDoubleCheckoutStatsOmittingUnresolvedLegs,
  visitScoreCouldHideDoubleAttempt,
} from '@open-dart/analytics/doubleCheckoutStats'

const doubleOutRules = {
  doubleIn: false,
  doubleOut: true,
}

const visit = (overrides: Partial<Visit>): Visit => ({
  visitIndex: 0,
  playerId: 'p1',
  darts: [],
  visitScore: 0,
  scoreBefore: 501,
  scoreAfter: 501,
  bust: false,
  checkout: false,
  ...overrides,
})

const visitFromDarts = (scoreBefore: number, darts: DartThrow[]): Visit =>
  visit({
    scoreBefore,
    darts,
    visitScore: 0,
    scoreAfter: scoreBefore,
  })

describe('countDoubleCheckoutStatsForVisit', () => {
  it.each([
    {
      name: 'records a hit when the finishing double is taken',
      scoreBefore: 16,
      darts: [numberDart(8, DartMultiplier.Double)],
      expected: { attempts: 1, successes: 1 },
    },
    {
      name: 'records a miss for any scoring dart that is not the finish',
      scoreBefore: 16,
      darts: [numberDart(11, DartMultiplier.Single)],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records a miss for a same-wedge single that leaves a lower double',
      scoreBefore: 16,
      darts: [numberDart(8, DartMultiplier.Single)],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records a miss for a dart that scores nothing',
      scoreBefore: 16,
      darts: [missDart()],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records a miss when the dart busts the visit',
      scoreBefore: 16,
      darts: [numberDart(20, DartMultiplier.Triple)],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records a miss when a wrong double busts the visit',
      scoreBefore: 16,
      darts: [numberDart(16, DartMultiplier.Double)],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records a miss when outer bull is thrown at a number double',
      scoreBefore: 16,
      darts: [outerBullDart(DartMultiplier.Single)],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records one attempt for each dart while remaining stays on a finish',
      scoreBefore: 16,
      darts: [
        numberDart(4, DartMultiplier.Single),
        numberDart(4, DartMultiplier.Single),
        numberDart(4, DartMultiplier.Single),
      ],
      expected: { attempts: 3, successes: 0 },
    },
    {
      name: 'stops counting once remaining is no longer a finishing double',
      scoreBefore: 16,
      darts: [
        numberDart(11, DartMultiplier.Single),
        numberDart(20, DartMultiplier.Single),
        numberDart(5, DartMultiplier.Single),
      ],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records a miss when splitting toward a preferred double',
      scoreBefore: 38,
      darts: [numberDart(6, DartMultiplier.Single)],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records a miss when splitting an uneven double',
      scoreBefore: 18,
      darts: [numberDart(2, DartMultiplier.Single)],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records a miss then a hit when a later dart finishes',
      scoreBefore: 40,
      darts: [numberDart(10, DartMultiplier.Single), numberDart(15, DartMultiplier.Double)],
      expected: { attempts: 2, successes: 1 },
    },
    {
      name: 'records a miss when a non-finishing double leaves another double',
      scoreBefore: 40,
      darts: [numberDart(10, DartMultiplier.Double)],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records a hit when bull is taken',
      scoreBefore: 50,
      darts: [bullDart()],
      expected: { attempts: 1, successes: 1 },
    },
    {
      name: 'records a miss when outer bull is thrown at bull',
      scoreBefore: 50,
      darts: [outerBullDart(DartMultiplier.Single)],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'records a miss when splitting bull toward a preferred double',
      scoreBefore: 50,
      darts: [numberDart(18, DartMultiplier.Single)],
      expected: { attempts: 1, successes: 0 },
    },
    {
      name: 'ignores setup darts before a finishing double is available',
      scoreBefore: 41,
      darts: [numberDart(9, DartMultiplier.Single)],
      expected: { attempts: 0, successes: 0 },
    },
    {
      name: 'ignores setup darts on a multi-dart checkout and counts the finish',
      scoreBefore: 60,
      darts: [numberDart(20, DartMultiplier.Single), numberDart(20, DartMultiplier.Double)],
      expected: { attempts: 1, successes: 1 },
    },
    {
      name: 'counts only after a visit first reaches a finishing double',
      scoreBefore: 120,
      darts: [
        numberDart(20, DartMultiplier.Triple),
        numberDart(20, DartMultiplier.Single),
        numberDart(20, DartMultiplier.Single),
      ],
      expected: { attempts: 1, successes: 0 },
    },
  ])('$name', ({ scoreBefore, darts, expected }) => {
    const { stats } = countDoubleCheckoutStatsForVisit(
      visitFromDarts(scoreBefore, darts),
      doubleOutRules,
      false,
      true,
    )

    expect(stats).toEqual(expected)
  })
})

describe('countDoubleCheckoutStats', () => {
  it('merges stats across visits', () => {
    const stats = countDoubleCheckoutStats(
      [
        visit({
          scoreBefore: 32,
          darts: [numberDart(16, DartMultiplier.Single)],
          visitScore: 16,
          scoreAfter: 16,
        }),
        visit({
          visitIndex: 1,
          scoreBefore: 16,
          darts: [numberDart(8, DartMultiplier.Double)],
          visitScore: 16,
          scoreAfter: 0,
          checkout: true,
        }),
      ],
      doubleOutRules,
    )

    expect(stats).toEqual({ attempts: 2, successes: 1 })
  })
})

describe('visitScoreCouldHideDoubleAttempt', () => {
  it('returns false for a visit total above 170', () => {
    expect(
      visitScoreCouldHideDoubleAttempt(
        visit({
          scoreBefore: 501,
          visitScore: 180,
          scoreAfter: 321,
          inputMode: VisitInputMode.VisitScore,
        }),
        doubleOutRules,
        false,
        true,
      ),
    ).toBe(false)
  })

  it('returns true for a visit total of 100 from 120', () => {
    expect(
      visitScoreCouldHideDoubleAttempt(
        visit({
          scoreBefore: 120,
          visitScore: 100,
          scoreAfter: 20,
          inputMode: VisitInputMode.VisitScore,
        }),
        doubleOutRules,
        false,
        true,
      ),
    ).toBe(true)
  })

  it('returns false for a visit total of 26 from 120', () => {
    expect(
      visitScoreCouldHideDoubleAttempt(
        visit({
          scoreBefore: 120,
          visitScore: 26,
          scoreAfter: 94,
          inputMode: VisitInputMode.VisitScore,
        }),
        doubleOutRules,
        false,
        true,
      ),
    ).toBe(false)
  })

  it('returns true for a visit-score checkout', () => {
    expect(
      visitScoreCouldHideDoubleAttempt(
        visit({
          scoreBefore: 40,
          visitScore: 40,
          scoreAfter: 0,
          checkout: true,
          inputMode: VisitInputMode.VisitScore,
        }),
        doubleOutRules,
        false,
        true,
      ),
    ).toBe(true)
  })

  it('returns true when the visit starts on a finishing double', () => {
    expect(
      visitScoreCouldHideDoubleAttempt(
        visit({
          scoreBefore: 32,
          visitScore: 0,
          scoreAfter: 32,
          inputMode: VisitInputMode.VisitScore,
        }),
        doubleOutRules,
        false,
        true,
      ),
    ).toBe(true)
  })

  it('returns false for a bogey start that cannot reach a double', () => {
    expect(
      visitScoreCouldHideDoubleAttempt(
        visit({
          scoreBefore: 159,
          visitScore: 60,
          scoreAfter: 99,
          inputMode: VisitInputMode.VisitScore,
        }),
        doubleOutRules,
        false,
        true,
      ),
    ).toBe(false)
  })

  it('returns true for a bust from a checkout score', () => {
    expect(
      visitScoreCouldHideDoubleAttempt(
        visit({
          scoreBefore: 60,
          visitScore: 0,
          scoreAfter: 60,
          bust: true,
          inputMode: VisitInputMode.VisitScore,
        }),
        doubleOutRules,
        false,
        true,
      ),
    ).toBe(true)
  })

  it('returns false when the visit ends above the next double under 50', () => {
    expect(
      visitScoreCouldHideDoubleAttempt(
        visit({
          scoreBefore: 45,
          visitScore: 2,
          scoreAfter: 43,
          inputMode: VisitInputMode.VisitScore,
        }),
        doubleOutRules,
        false,
        true,
      ),
    ).toBe(false)
  })
})

describe('countDoubleCheckoutStatsOmittingUnresolvedLegs', () => {
  it('counts a per-dart checkout after a visit total above 170', () => {
    const result = countDoubleCheckoutStatsOmittingUnresolvedLegs(
      [
        visit({
          legIndex: 1,
          scoreBefore: 501,
          visitScore: 180,
          scoreAfter: 321,
          inputMode: VisitInputMode.VisitScore,
        }),
        visit({
          legIndex: 1,
          visitIndex: 1,
          scoreBefore: 16,
          darts: [numberDart(8, DartMultiplier.Double)],
          visitScore: 16,
          scoreAfter: 0,
          checkout: true,
        }),
      ],
      doubleOutRules,
    )

    expect(result).toEqual({
      stats: { attempts: 1, successes: 1 },
      unavailable: false,
    })
  })

  it('skips a leg when a visit total of 100 from 120 could hide a double', () => {
    const result = countDoubleCheckoutStatsOmittingUnresolvedLegs(
      [
        visit({
          legIndex: 1,
          scoreBefore: 120,
          visitScore: 100,
          scoreAfter: 20,
          inputMode: VisitInputMode.VisitScore,
        }),
        visit({
          legIndex: 1,
          visitIndex: 1,
          scoreBefore: 20,
          darts: [numberDart(10, DartMultiplier.Double)],
          visitScore: 20,
          scoreAfter: 0,
          checkout: true,
        }),
      ],
      doubleOutRules,
    )

    expect(result).toEqual({
      stats: { attempts: 0, successes: 0 },
      unavailable: true,
    })
  })

  it('keeps a leg when a visit total of 26 from 120 cannot hide a double', () => {
    const result = countDoubleCheckoutStatsOmittingUnresolvedLegs(
      [
        visit({
          legIndex: 1,
          scoreBefore: 120,
          visitScore: 26,
          scoreAfter: 94,
          inputMode: VisitInputMode.VisitScore,
        }),
        visit({
          legIndex: 1,
          visitIndex: 1,
          scoreBefore: 40,
          darts: [numberDart(20, DartMultiplier.Double)],
          visitScore: 40,
          scoreAfter: 0,
          checkout: true,
        }),
      ],
      doubleOutRules,
    )

    expect(result).toEqual({
      stats: { attempts: 1, successes: 1 },
      unavailable: false,
    })
  })

  it('skips a visit-score checkout leg and still counts a separate per-dart leg', () => {
    const result = countDoubleCheckoutStatsOmittingUnresolvedLegs(
      [
        visit({
          legIndex: 1,
          scoreBefore: 40,
          darts: [],
          visitScore: 40,
          scoreAfter: 0,
          checkout: true,
          inputMode: VisitInputMode.VisitScore,
        }),
        visit({
          legIndex: 2,
          visitIndex: 1,
          scoreBefore: 16,
          darts: [numberDart(8, DartMultiplier.Double)],
          visitScore: 16,
          scoreAfter: 0,
          checkout: true,
        }),
      ],
      doubleOutRules,
    )

    expect(result).toEqual({
      stats: { attempts: 1, successes: 1 },
      unavailable: false,
    })
  })

  it('averages only legs whose finish darts were logged', () => {
    const loggedFinish = (legIndex: number, visitIndex: number): Visit =>
      visit({
        legIndex,
        visitIndex,
        scoreBefore: 32,
        darts: [numberDart(16, DartMultiplier.Double)],
        visitScore: 32,
        scoreAfter: 0,
        checkout: true,
      })

    const visitScoreFinish = (legIndex: number, visitIndex: number): Visit =>
      visit({
        legIndex,
        visitIndex,
        scoreBefore: 40,
        darts: [],
        visitScore: 40,
        scoreAfter: 0,
        checkout: true,
        inputMode: VisitInputMode.VisitScore,
      })

    const result = countDoubleCheckoutStatsOmittingUnresolvedLegs(
      [
        loggedFinish(1, 0),
        visitScoreFinish(2, 1),
        loggedFinish(3, 2),
        visitScoreFinish(4, 3),
        loggedFinish(5, 4),
      ],
      doubleOutRules,
    )

    expect(result).toEqual({
      stats: { attempts: 3, successes: 3 },
      unavailable: false,
    })
  })

  it('marks unavailable when every finish was a visit total', () => {
    const result = countDoubleCheckoutStatsOmittingUnresolvedLegs(
      [
        visit({
          legIndex: 1,
          scoreBefore: 40,
          visitScore: 40,
          scoreAfter: 0,
          checkout: true,
          inputMode: VisitInputMode.VisitScore,
        }),
      ],
      doubleOutRules,
    )

    expect(result).toEqual({
      stats: { attempts: 0, successes: 0 },
      unavailable: true,
    })
  })

  it('does not mark unavailable when nobody reached a double', () => {
    const result = countDoubleCheckoutStatsOmittingUnresolvedLegs(
      [
        visit({
          legIndex: 1,
          scoreBefore: 501,
          visitScore: 180,
          scoreAfter: 321,
          inputMode: VisitInputMode.VisitScore,
        }),
      ],
      doubleOutRules,
    )

    expect(result).toEqual({
      stats: { attempts: 0, successes: 0 },
      unavailable: false,
    })
  })
})
