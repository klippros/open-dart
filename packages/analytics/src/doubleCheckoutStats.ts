import type { CheckoutRules } from '@open-dart/game/types/checkout.ts'
import type { DartThrow } from '@open-dart/game/types/dart.ts'
import type { Visit } from '@open-dart/game/types/visit.ts'
import { visitUsesVisitScoreInput } from '@open-dart/game/types/visit.ts'
import { isDoubleDart } from '@open-dart/game/dartScoring.ts'
import { MAX_CHECKOUT_SCORE } from '@open-dart/game/checkout/checkoutSuggestions.ts'
import { isSingleDartDoubleFinish } from '@open-dart/game/checkout/checkoutFallback.ts'
import { DOUBLE_OUT_BOGEY_SCORES } from '@open-dart/game/checkout/pdcCheckoutTable.ts'

export interface DoubleCheckoutStats {
  attempts: number
  successes: number
}

export interface DoubleCheckoutCountResult {
  stats: DoubleCheckoutStats
  unavailable: boolean
}

export const emptyDoubleCheckoutStats = (): DoubleCheckoutStats => ({
  attempts: 0,
  successes: 0,
})

export const mergeDoubleCheckoutStats = (
  left: DoubleCheckoutStats,
  right: DoubleCheckoutStats,
): DoubleCheckoutStats => ({
  attempts: left.attempts + right.attempts,
  successes: left.successes + right.successes,
})

const countsTowardScore = (dart: DartThrow, doubleIn: boolean, hasOpened: boolean): boolean => {
  if (dart.points === 0) {
    return false
  }

  if (!doubleIn || hasOpened) {
    return true
  }

  return isDoubleDart(dart)
}

const applyDartToRemaining = (
  remaining: number,
  dart: DartThrow,
  rules: CheckoutRules,
): { remaining: number; bust: boolean; checkout: boolean } => {
  const nextRemaining = remaining - dart.points

  if (nextRemaining < 0) {
    return { remaining, bust: true, checkout: false }
  }

  if (nextRemaining === 1 && rules.doubleOut) {
    return { remaining, bust: true, checkout: false }
  }

  if (nextRemaining === 0) {
    if (rules.doubleOut && !isDoubleDart(dart)) {
      return { remaining, bust: true, checkout: false }
    }

    return { remaining: 0, bust: false, checkout: true }
  }

  return { remaining: nextRemaining, bust: false, checkout: false }
}

/** Next finishing double (or bull) below the visit start, once the start itself is not a finish. */
const nextFinishingDoubleBelow = (scoreBefore: number): number => {
  if (scoreBefore > 50) {
    return 50
  }

  for (let remaining = scoreBefore - 1; remaining >= 2; remaining -= 1) {
    if (isSingleDartDoubleFinish(remaining)) {
      return remaining
    }
  }

  return 2
}

/**
 * True when a visit total could hide a dart thrown while a finishing double
 * (or bull) was available. Uses score-before / score-after rules instead of
 * enumerating dart sequences.
 */
export const visitScoreCouldHideDoubleAttempt = (
  visit: Visit,
  rules: CheckoutRules,
  _doubleIn: boolean,
  _hasOpenedBefore: boolean,
): boolean => {
  if (!visitUsesVisitScoreInput(visit) || !rules.doubleOut) {
    return false
  }

  // A recorded checkout always includes a finishing double (or bull), and that
  // dart was not logged.
  if (visit.checkout) {
    return true
  }

  const scoreBefore = visit.scoreBefore

  if (scoreBefore > MAX_CHECKOUT_SCORE) {
    return false
  }

  if (isSingleDartDoubleFinish(scoreBefore)) {
    return true
  }

  if (DOUBLE_OUT_BOGEY_SCORES.has(scoreBefore)) {
    return false
  }

  if (visit.bust) {
    return true
  }

  // Ended above the next double: never stood on a finish during this visit.
  if (visit.scoreAfter > nextFinishingDoubleBelow(scoreBefore)) {
    return false
  }

  return true
}

export const countDoubleCheckoutStatsForVisit = (
  visit: Visit,
  rules: CheckoutRules,
  doubleIn: boolean,
  hasOpenedBefore: boolean,
): { stats: DoubleCheckoutStats; hasOpenedAfter: boolean } => {
  let remaining = visit.scoreBefore
  let opened = hasOpenedBefore
  const stats = emptyDoubleCheckoutStats()

  for (const dart of visit.darts) {
    if (remaining <= 0) {
      break
    }

    const onFinishingDouble = rules.doubleOut && isSingleDartDoubleFinish(remaining)

    if (onFinishingDouble) {
      stats.attempts += 1
    }

    const scoringDart = countsTowardScore(dart, doubleIn, opened)

    if (!scoringDart) {
      continue
    }

    if (!opened && doubleIn) {
      opened = true
    }

    const outcome = applyDartToRemaining(remaining, dart, rules)

    if (onFinishingDouble && outcome.checkout) {
      stats.successes += 1
    }

    if (outcome.bust || outcome.checkout) {
      break
    }

    remaining = outcome.remaining
  }

  return { stats, hasOpenedAfter: opened }
}

const computeHasOpenedBeforeVisit = (priorVisits: Visit[], doubleIn: boolean): boolean => {
  if (!doubleIn) {
    return true
  }

  let opened = false

  for (const visit of priorVisits) {
    if (visitUsesVisitScoreInput(visit)) {
      if (!visit.bust && visit.visitScore > 0) {
        opened = true
      }

      continue
    }

    for (const dart of visit.darts) {
      if (countsTowardScore(dart, doubleIn, opened) && !opened) {
        opened = true
      }
    }
  }

  return opened
}

export const countDoubleCheckoutStats = (
  visits: Visit[],
  rules: CheckoutRules,
  doubleIn = false,
): DoubleCheckoutStats =>
  visits.reduce<DoubleCheckoutStats>((totals, visit, index) => {
    const hasOpenedBefore = computeHasOpenedBeforeVisit(visits.slice(0, index), doubleIn)
    const { stats } = countDoubleCheckoutStatsForVisit(visit, rules, doubleIn, hasOpenedBefore)

    return mergeDoubleCheckoutStats(totals, stats)
  }, emptyDoubleCheckoutStats())

const groupVisitsByLeg = (visits: Visit[]): Visit[][] => {
  const groups = new Map<number | 'none', Visit[]>()

  for (const visit of visits) {
    const key = visit.legIndex ?? 'none'
    const existing = groups.get(key)

    if (existing === undefined) {
      groups.set(key, [visit])
    } else {
      existing.push(visit)
    }
  }

  return [...groups.values()]
}

const legHasUnresolvedVisitScoreDouble = (
  legVisits: Visit[],
  rules: CheckoutRules,
  doubleIn: boolean,
): boolean =>
  legVisits.some((visit, index) => {
    if (!visitUsesVisitScoreInput(visit)) {
      return false
    }

    const hasOpenedBefore = computeHasOpenedBeforeVisit(legVisits.slice(0, index), doubleIn)

    return visitScoreCouldHideDoubleAttempt(visit, rules, doubleIn, hasOpenedBefore)
  })

/**
 * Legs with a visit total that could hide a dart at a double are omitted.
 * Remaining legs contribute only their per-dart double attempts.
 */
export const countDoubleCheckoutStatsOmittingUnresolvedLegs = (
  visits: Visit[],
  rules: CheckoutRules,
  doubleIn = false,
): DoubleCheckoutCountResult => {
  let sawUnresolved = false

  const stats = groupVisitsByLeg(visits).reduce<DoubleCheckoutStats>((totals, legVisits) => {
    if (legHasUnresolvedVisitScoreDouble(legVisits, rules, doubleIn)) {
      sawUnresolved = true
      return totals
    }

    return mergeDoubleCheckoutStats(totals, countDoubleCheckoutStats(legVisits, rules, doubleIn))
  }, emptyDoubleCheckoutStats())

  return {
    stats,
    unavailable: stats.attempts === 0 && sawUnresolved,
  }
}
