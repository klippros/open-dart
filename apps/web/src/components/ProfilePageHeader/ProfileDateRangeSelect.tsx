import type { DateRangePreset } from '@open-dart/analytics/sessionFilters'
import {
  PROFILE_DATE_RANGE_OPTIONS,
  parseDateRangePreset,
} from '../../lib/profile/profileDateRange'

const selectStyle = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  fontSize: '0.875rem',
} as const

export interface ProfileDateRangeSelectProps {
  value: DateRangePreset
  onChange: (value: DateRangePreset) => void
}

export const ProfileDateRangeSelect = ({ value, onChange }: ProfileDateRangeSelectProps) => (
  <select
    aria-label="Date range"
    style={selectStyle}
    value={value}
    onChange={(event) => {
      const next = parseDateRangePreset(event.target.value)
      if (next !== null) {
        onChange(next)
      }
    }}
  >
    {PROFILE_DATE_RANGE_OPTIONS.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
)
