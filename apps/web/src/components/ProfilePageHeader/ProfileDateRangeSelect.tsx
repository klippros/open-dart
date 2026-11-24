import type { DateRangePreset } from '@open-dart/analytics/sessionFilters'
import {
  PROFILE_DATE_RANGE_OPTIONS,
  parseDateRangePreset,
} from '../../lib/profile/profileDateRange'
import { profileDropdownControlStyle } from './profileDropdownControlStyle'

export interface ProfileDateRangeSelectProps {
  value: DateRangePreset
  onChange: (value: DateRangePreset) => void
}

export const ProfileDateRangeSelect = ({ value, onChange }: ProfileDateRangeSelectProps) => (
  <select
    aria-label="Date range"
    style={profileDropdownControlStyle}
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
