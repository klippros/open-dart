import type { DartThrow } from '@open-dart/game/types/dart.ts'
import { DartSegmentType } from '@open-dart/game/types/dart.ts'
import { GameModeId } from '@open-dart/game/types/gameMode.ts'
import type { GameSession } from '@open-dart/game/types/gameSession.ts'
import { HunterOutcome } from '@open-dart/game/types/hunter.ts'
import { isCountingVisit } from '@open-dart/game/types/visit.ts'
import type { Visit } from '@open-dart/game/types/visit.ts'
import {
  advanceHunterFieldIndex,
  getHunterFieldIndexForNumber,
  getHunterFieldNumber,
} from '@open-dart/game/hunter/hunterClock.ts'
import {
  getHunterAdvanceForDart,
  getHunterOutcome,
  isHunterTargetHit,
} from '@open-dart/game/hunter/hunterRules.ts'
import { getPrimaryPlayerVisits } from './visitStats.ts'

export interface HunterPlayerLiveStats {
  hitRate: number | null
  avgAdvancesPerVisit: number | null
  dartsThrown: number
  hits: number
  advances: number
  visitCount: number
}

export interface HunterSingleSessionPlayerStats extends HunterPlayerLiveStats {
  playerId: string
  name: string
}

export interface HunterSingleSessionStats {
  players: HunterSingleSessionPlayerStats[]
}

export interface HunterPracticeRollup {
  gameCount: number
  avgAdvancesPerVisit: number | null
  hitRate: number | null
  dartsThrown: number
  hits: number
  advances: number
  visitCount: number
}

const advanceFieldNumber = (fieldNumber: number, steps: number): number =>
  getHunterFieldNumber(advanceHunterFieldIndex(getHunterFieldIndexForNumber(fieldNumber), steps))

const getVisitStartFieldNumber = (visit: Visit): number | null => {
  const fromMetadata = visit.metadata?.fieldNumber

  if (typeof fromMetadata === 'number' && Number.isFinite(fromMetadata)) {
    return fromMetadata
  }

  return null
}

const getVisitAdvances = (visit: Visit): number => {
  const fromMetadata = visit.metadata?.advances

  if (typeof fromMetadata === 'number' && Number.isFinite(fromMetadata)) {
    return fromMetadata
  }

  return visit.visitScore
}

const accumulatePendingDarts = (
  pendingDarts: DartThrow[],
): Pick<HunterPlayerLiveStats, 'dartsThrown' | 'hits' | 'advances'> => {
  let dartsThrown = 0
  let hits = 0
  let advances = 0

  for (const dart of pendingDarts) {
    dartsThrown += 1

    // Picker-built hits encode the aimed field on the dart; misses advance 0.
    if (dart.segment.type !== DartSegmentType.Number) {
      continue
    }

    const aimedField = dart.segment.value
    if (!isHunterTargetHit(dart, aimedField)) {
      continue
    }

    hits += 1
    advances += getHunterAdvanceForDart(dart, aimedField)
  }

  return { dartsThrown, hits, advances }
}

export const computeHunterPlayerStats = (
  visits: Visit[],
  playerId: string,
  pendingDarts: DartThrow[] = [],
): HunterPlayerLiveStats => {
  let dartsThrown = 0
  let hits = 0
  let advances = 0
  let visitCount = 0

  for (const visit of visits) {
    if (!isCountingVisit(visit) || visit.playerId !== playerId) {
      continue
    }

    visitCount += 1
    advances += getVisitAdvances(visit)

    const startField = getVisitStartFieldNumber(visit)

    if (startField === null) {
      dartsThrown += visit.darts.length
      continue
    }

    let fieldNumber = startField

    for (const dart of visit.darts) {
      dartsThrown += 1

      if (isHunterTargetHit(dart, fieldNumber)) {
        hits += 1
      }

      const step = getHunterAdvanceForDart(dart, fieldNumber)
      fieldNumber = advanceFieldNumber(fieldNumber, step)
    }
  }

  if (pendingDarts.length > 0) {
    const pending = accumulatePendingDarts(pendingDarts)
    dartsThrown += pending.dartsThrown
    hits += pending.hits
    advances += pending.advances
    visitCount += 1
  }

  return {
    hitRate: dartsThrown === 0 ? null : (hits / dartsThrown) * 100,
    avgAdvancesPerVisit: visitCount === 0 ? null : advances / visitCount,
    dartsThrown,
    hits,
    advances,
    visitCount,
  }
}

export const computeHunterPrimaryPlayerStats = (
  session: GameSession,
): HunterPlayerLiveStats | null => {
  if (session.mode !== GameModeId.Hunter) {
    return null
  }

  const primary = getPrimaryPlayerVisits(session)
  const playerId = primary[0]?.playerId ?? session.players[0]?.id

  if (playerId === undefined) {
    return null
  }

  return computeHunterPlayerStats(session.visits, playerId)
}

export const computeHunterSingleSessionStats = (
  session: GameSession,
): HunterSingleSessionStats | null => {
  if (session.mode !== GameModeId.Hunter) {
    return null
  }

  return {
    players: session.players.map((player) => ({
      playerId: player.id,
      name: player.name,
      ...computeHunterPlayerStats(session.visits, player.id),
    })),
  }
}

export const computeHunterPracticeRollup = (sessions: GameSession[]): HunterPracticeRollup => {
  const modeSessions = sessions.filter((session) => session.mode === GameModeId.Hunter)

  let dartsThrown = 0
  let hits = 0
  let advances = 0
  let visitCount = 0

  for (const session of modeSessions) {
    const stats = computeHunterPrimaryPlayerStats(session)

    if (stats === null) {
      continue
    }

    dartsThrown += stats.dartsThrown
    hits += stats.hits
    advances += stats.advances
    visitCount += stats.visitCount
  }

  return {
    gameCount: modeSessions.length,
    avgAdvancesPerVisit: visitCount === 0 ? null : advances / visitCount,
    hitRate: dartsThrown === 0 ? null : (hits / dartsThrown) * 100,
    dartsThrown,
    hits,
    advances,
    visitCount,
  }
}

export const HUNTER_OUTCOME_LABELS: Record<HunterOutcome, string> = {
  [HunterOutcome.Miss]: 'Miss',
  [HunterOutcome.Single]: 'Single',
  [HunterOutcome.Double]: 'Double',
  [HunterOutcome.Triple]: 'Treble',
}

export const getHunterThrownOutcome = (dart: DartThrow, fieldNumber: number): HunterOutcome =>
  getHunterOutcome(dart, fieldNumber)
