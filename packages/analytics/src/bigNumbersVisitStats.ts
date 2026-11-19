import type { GameSession } from '@open-dart/game/types/gameSession.ts'
import type { Visit } from '@open-dart/game/types/visit.ts'
import { GameModeId } from '@open-dart/game/types/gameMode.ts'
import type { BigNumbersRequiredHits } from '@open-dart/game/types/bigNumbers.ts'
import { isBigNumbersConfig } from '@open-dart/game/game/gameConfigGuards.ts'
import { getBigNumbersConfig } from '@open-dart/game/bigNumbers/bigNumbersConfig.ts'
import { getPrimaryPlayerVisits } from './visitStats.ts'

const readMetadataHitCount = (metadata: Visit['metadata']): number | null => {
  const hitCount = metadata?.hitCount

  if (typeof hitCount === 'number' && Number.isFinite(hitCount) && hitCount >= 0) {
    return hitCount
  }

  return null
}

export const getBigNumbersVisitHitCount = (visit: Visit): number => {
  const metadataHitCount = readMetadataHitCount(visit.metadata)

  if (metadataHitCount !== null) {
    return metadataHitCount
  }

  return visit.visitScore >= 0 ? visit.visitScore : 0
}

const readVisitAdvanced = (visit: Visit): boolean | null => {
  const advanced = visit.metadata?.advanced

  return typeof advanced === 'boolean' ? advanced : null
}

/** True when the visit moved the player back a number. Staying on 1 does not count. */
export const isBigNumbersStepBackVisit = (visit: Visit): boolean => {
  const advanced = readVisitAdvanced(visit)

  if (advanced === true) {
    return false
  }

  if (advanced === false) {
    return visit.scoreBefore > 1
  }

  return visit.scoreAfter < visit.scoreBefore
}

export interface BigNumbersLiveStats {
  visitCount: number
  stepBackCount: number
}

export const getBigNumbersAvgHitsPerVisit = (visits: Visit[]): number | null => {
  if (visits.length === 0) {
    return null
  }

  const totalHits = visits.reduce((sum, visit) => sum + getBigNumbersVisitHitCount(visit), 0)

  return totalHits / visits.length
}

export const getBigNumbersStepBackCount = (visits: Visit[]): number =>
  visits.reduce((sum, visit) => sum + (isBigNumbersStepBackVisit(visit) ? 1 : 0), 0)

export const getBigNumbersLiveStats = (visits: Visit[], playerId: string): BigNumbersLiveStats => {
  const playerVisits = visits.filter((visit) => visit.playerId === playerId)

  return {
    visitCount: playerVisits.length,
    stepBackCount: getBigNumbersStepBackCount(playerVisits),
  }
}

export const getBigNumbersSessionVisitCount = (session: GameSession): number =>
  getPrimaryPlayerVisits(session).length

export const isCompletedBigNumbersSession = (session: GameSession): boolean =>
  session.mode === GameModeId.BigNumbers && session.finishedEarly !== true

export const getBigNumbersRequiredHits = (session: GameSession): BigNumbersRequiredHits | null => {
  if (!isBigNumbersConfig(session.mode, session.config)) {
    return null
  }

  return getBigNumbersConfig(session.config).requiredHits
}

export interface BigNumbersSingleSessionStats {
  visitCount: number
  avgHitsPerVisit: number | null
  completed: boolean
}

export const computeBigNumbersSingleSessionStats = (
  session: GameSession,
): BigNumbersSingleSessionStats | null => {
  if (session.mode !== GameModeId.BigNumbers) {
    return null
  }

  const visits = getPrimaryPlayerVisits(session)

  return {
    visitCount: visits.length,
    avgHitsPerVisit: getBigNumbersAvgHitsPerVisit(visits),
    completed: isCompletedBigNumbersSession(session),
  }
}
