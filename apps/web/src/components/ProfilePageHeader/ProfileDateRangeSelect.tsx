import type { DateRangePreset } from '@open-dart/analytics/sessionFilters'
import {
  PROFILE_DATE_RANGE_OPTIONS,
  parseDateRangePreset,
} from '../../lib/profile/profileDateRange'

const SELECT_INSET = '12px'

const caretSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
)

const selectStyle = {
  appearance: 'none',
  WebkitAppearance: 'none',
  padding: `8px 36px 8px ${SELECT_INSET}`,
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backgroundImage: `url("data:image/svg+xml,${caretSvg}")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: `right ${SELECT_INSET} center`,
  backgroundSize: '12px 12px',
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
