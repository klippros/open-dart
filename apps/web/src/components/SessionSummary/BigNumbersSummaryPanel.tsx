import { SimpleGrid } from '@chakra-ui/react'
import { formatAverage, formatInteger } from '../../lib/analytics/formatAnalytics'
import { computeBigNumbersSingleSessionStats } from '@open-dart/analytics/bigNumbersVisitStats'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { StatCard } from './StatCard'

export interface BigNumbersSummaryPanelProps {
  session: GameSession
}

export const BigNumbersSummaryPanel = ({ session }: BigNumbersSummaryPanelProps) => {
  const stats = computeBigNumbersSingleSessionStats(session)

  if (stats === null) {
    return null
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
      <StatCard label="Required" value={formatInteger(stats.requiredHits)} />
      <StatCard label="Hits/visit" value={formatAverage(stats.avgHitsPerVisit, 1)} />
      <StatCard label="Visits" value={formatInteger(stats.visitCount)} />
      <StatCard label="Failed" value={formatInteger(stats.stepBackCount)} />
    </SimpleGrid>
  )
}
