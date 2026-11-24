import { SimpleGrid } from '@chakra-ui/react'
import {
  formatAverage,
  formatCheckoutPercent,
  formatInteger,
} from '../../lib/analytics/formatAnalytics'
import { computeOneTwentyOneSingleSessionStats } from '@open-dart/analytics/oneTwentyOneVisitStats'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { StatCard } from './StatCard'

export interface OneTwentyOneSummaryPanelProps {
  session: GameSession
}

export const OneTwentyOneSummaryPanel = ({ session }: OneTwentyOneSummaryPanelProps) => {
  const stats = computeOneTwentyOneSingleSessionStats(session)

  if (stats === null) {
    return null
  }

  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
      <StatCard
        label="Checkouts"
        value={formatInteger(stats.checkouts)}
        detail={`${stats.visitCount} visit${stats.visitCount === 1 ? '' : 's'}`}
      />
      <StatCard label="3-dart average" value={formatAverage(stats.threeDartAverage)} />
      {stats.checkoutRate !== null && (
        <StatCard label="Checkout rate" value={formatCheckoutPercent(stats.checkoutRate)} />
      )}
      {stats.highestCheckout !== null && (
        <StatCard label="Highest checkout" value={formatInteger(stats.highestCheckout)} />
      )}
    </SimpleGrid>
  )
}
