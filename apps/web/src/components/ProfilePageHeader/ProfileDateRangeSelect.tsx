import type { DateRangePreset } from '@open-dart/analytics/sessionFilters'
import { DropdownSelect } from '../DropdownSelect/DropdownSelect'
import {
  PROFILE_DATE_RANGE_OPTIONS,
  parseDateRangePreset,
} from '../../lib/profile/profileDateRange'

export interface ProfileDateRangeSelectProps {
  value: DateRangePreset
  onChange: (value: DateRangePreset) => void
}

export const ProfileDateRangeSelect = ({ value, onChange }: ProfileDateRangeSelectProps) => (
  <DropdownSelect
    label="Date range"
    value={value}
    options={PROFILE_DATE_RANGE_OPTIONS}
    onChange={(nextValue) => {
      const next = parseDateRangePreset(nextValue)
      if (next !== null) {
        onChange(next)
      }
    }}
  />
)
