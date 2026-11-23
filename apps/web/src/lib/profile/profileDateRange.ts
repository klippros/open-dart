import type { DateRangePreset } from '@open-dart/analytics/sessionFilters'

export const DEFAULT_PROFILE_DATE_RANGE: DateRangePreset = '30d'

export const PROFILE_DATE_RANGE_OPTIONS: readonly { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

export const OTHER_PROFILE_WINDOW_LABEL = 'Last 30 days'

export const parseDateRangePreset = (value: string): DateRangePreset | null =>
  value === 'all' || value === '7d' || value === '30d' ? value : null
