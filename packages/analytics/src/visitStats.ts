import type { Player } from '@open-dart/game/types/player.ts'
import { PlayerKind } from '@open-dart/game/types/player.ts'
import type { GameSession } from '@open-dart/game/types/gameSession.ts'
import type { Visit } from '@open-dart/game/types/visit.ts'
import { getVisitDartCount, isCountingVisit } from '@open-dart/game/types/visit.ts'
import { MAX_CHECKOUT_SCORE } from '@open-dart/game/checkout/checkoutSuggestions.ts'
import { isSingleDartDoubleFinish } from '@open-dart/game/checkout/checkoutFallback.ts'
import { getVisitsForLeg } from '@open-dart/game/game/matchLegs.ts'

export const getPrimaryPlayerVisits = (session: GameSession): Visit[] => {
  const humanPlayer = session.players.find((player) => player.kind === PlayerKind.Human)
  const playerId = humanPlayer?.id ?? session.players[0]?.id

  if (playerId === undefined) {
    return session.visits.filter(isCountingVisit)
  }

  return session.visits.filter((visit) => visit.playerId === playerId && isCountingVisit(visit))
}

export const getPlayerVisits = (visits: Visit[], playerId: string): Visit[] =>
  visits.filter((visit) => visit.playerId === playerId && isCountingVisit(visit))

export const getSessionFinalScore = (session: GameSession): number | null => {
  const lastVisit = getPrimaryPlayerVisits(session).at(-1)

  return lastVisit?.scoreAfter ?? null
}

export const countDartsInSession = (session: GameSession): number =>
  getPrimaryPlayerVisits(session).reduce((sum, visit) => sum + getVisitDartCount(visit), 0)

export const countTotalDartsThrown = (sessions: GameSession[]): number =>
  sessions.reduce((total, session) => total + countDartsInSession(session), 0)

export const getThreeDartAverage = (visits: Visit[]): number | null => {
  if (visits.length === 0) {
    return null
  }

  const total = visits.reduce((sum, visit) => sum + visit.visitScore, 0)

  return total / visits.length
}

export interface BestThreeDartAverageLeg {
  average: number
  darts: number
  checkedOut: boolean
}

export interface BestThreeDartAverageMatch<T> extends BestThreeDartAverageLeg {
  item: T
}

/** Highest 3-dart average; ties prefer the leg with fewer darts. */
export const findBestThreeDartAverage = <T>(
  items: readonly T[],
  getVisits: (item: T) => Visit[],
): BestThreeDartAverageMatch<T> | null => {
  let best: BestThreeDartAverageMatch<T> | null = null

  for (const item of items) {
    const visits = getVisits(item)
    const average = getThreeDartAverage(visits)

    if (average === null) {
      continue
    }

    const darts = visits.reduce((sum, visit) => sum + getVisitDartCount(visit), 0)
    const checkedOut = visits.some((visit) => visit.checkout)

    if (
      best === null ||
      average > best.average ||
      (average === best.average && darts < best.darts)
    ) {
      best = { item, average, darts, checkedOut }
    }
  }

  return best
}

/** Highest 3-dart average; ties prefer the leg with fewer darts. */
export const getBestThreeDartAverageLeg = (
  visitGroups: Visit[][],
): BestThreeDartAverageLeg | null => {
  const best = findBestThreeDartAverage(visitGroups, (visits) => visits)

  if (best === null) {
    return null
  }

  return { average: best.average, darts: best.darts, checkedOut: best.checkedOut }
}

export const getMaxThreeDartAverage = (visitGroups: Visit[][]): number | null =>
  getBestThreeDartAverageLeg(visitGroups)?.average ?? null

export const getScoringVisits = (visits: Visit[]): Visit[] =>
  visits.filter((visit) => visit.scoreBefore > MAX_CHECKOUT_SCORE)

export const getVisitsBeforeDouble = (visits: Visit[]): Visit[] =>
  visits.filter((visit) => !isSingleDartDoubleFinish(visit.scoreBefore))

export const countCheckoutVisits = (visits: Visit[]): number =>
  visits.filter((visit) => visit.checkout).length

export const getSessionCheckoutRate = (session: GameSession): number | null => {
  const visits = getPrimaryPlayerVisits(session)

  if (visits.length === 0) {
    return null
  }

  return (countCheckoutVisits(visits) / visits.length) * 100
}

export const countThrown180 = (visits: Visit[]): number =>
  visits.filter((visit) => visit.visitScore === 180).length

export const countThrown140Plus = (visits: Visit[]): number =>
  visits.filter((visit) => visit.visitScore >= 140 && visit.visitScore < 180).length

export const countThrown100Plus = (visits: Visit[]): number =>
  visits.filter((visit) => visit.visitScore >= 100 && visit.visitScore < 140).length

export const getHighestCheckout = (visits: Visit[]): number | null => {
  const checkoutScores = visits.filter((visit) => visit.checkout).map((visit) => visit.scoreBefore)

  if (checkoutScores.length === 0) {
    return null
  }

  return Math.max(...checkoutScores)
}

export const getHighestVisit = (visits: Visit[]): number | null => {
  if (visits.length === 0) {
    return null
  }

  return Math.max(...visits.map((visit) => visit.visitScore))
}

export const countCheckouts100Plus = (visits: Visit[]): number =>
  visits.filter((visit) => visit.checkout && visit.scoreBefore >= 100).length

export const sessionFinishedWithCheckout = (session: GameSession): boolean =>
  getPrimaryPlayerVisits(session).some((visit) => visit.checkout)

export interface LegAndMatchAverages {
  leg: number | null
  match: number | null
}

export const getVisitAverages = (
  players: Player[],
  visits: Visit[],
): Record<string, number | null> =>
  Object.fromEntries(
    players.map((player) => [player.id, getThreeDartAverage(getPlayerVisits(visits, player.id))]),
  )

export const getLegAndMatchAverages = (
  players: Player[],
  visits: Visit[],
  currentLeg?: number,
): Record<string, LegAndMatchAverages> =>
  Object.fromEntries(
    players.map((player) => {
      const playerVisits = getPlayerVisits(visits, player.id)
      const matchAverage = getThreeDartAverage(playerVisits)
      const legVisits =
        currentLeg === undefined ? playerVisits : getVisitsForLeg(playerVisits, currentLeg)

      return [
        player.id,
        {
          leg: currentLeg === undefined ? matchAverage : getThreeDartAverage(legVisits),
          match: matchAverage,
        },
      ]
    }),
  )
