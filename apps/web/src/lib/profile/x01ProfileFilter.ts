import { X01StatsFilterId } from '@open-dart/analytics/x01Stats'
import type { X01LegStats, X01Stats } from '@open-dart/analytics/x01Stats'
import type { StatTimelineScope } from '../analytics/statTimelines'

export interface X01ProfileVariant {
  id: X01StatsFilterId
  label: string
  scope: StatTimelineScope
}

export const X01_PROFILE_VARIANTS: readonly X01ProfileVariant[] = [
  { id: X01StatsFilterId.FiveOhOneOnline, label: '501 online', scope: { type: 'x01-501-online' } },
  { id: X01StatsFilterId.FiveOhOne, label: '501', scope: { type: 'x01-501' } },
  { id: X01StatsFilterId.OneSeventy, label: '170', scope: { type: 'x01-170' } },
  { id: X01StatsFilterId.All, label: 'All', scope: { type: 'x01-all' } },
]

export const getX01VariantStats = (x01: X01Stats, id: X01StatsFilterId): X01LegStats => {
  switch (id) {
    case X01StatsFilterId.FiveOhOneOnline:
      return x01.fiveOhOneOnline
    case X01StatsFilterId.FiveOhOne:
      return x01.fiveOhOne
    case X01StatsFilterId.OneSeventy:
      return x01.oneSeventy
    case X01StatsFilterId.All:
      return x01.all
    default:
      return x01.all
  }
}

/** First variant with legs, so a player without online games lands on their local 501. */
export const pickDefaultX01Variant = (x01: X01Stats): X01StatsFilterId =>
  X01_PROFILE_VARIANTS.find((variant) => getX01VariantStats(x01, variant.id).legCount > 0)?.id ??
  X01StatsFilterId.FiveOhOneOnline

export const parseX01ProfileVariant = (value: string): X01StatsFilterId | null => {
  switch (value) {
    case '501-online':
      return X01StatsFilterId.FiveOhOneOnline
    case '501':
      return X01StatsFilterId.FiveOhOne
    case '170':
      return X01StatsFilterId.OneSeventy
    case 'all':
      return X01StatsFilterId.All
    default:
      return null
  }
}
