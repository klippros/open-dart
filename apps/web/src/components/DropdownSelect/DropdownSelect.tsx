import { chakra } from '@chakra-ui/react'
import { dropdownControlCss } from './dropdownControlCss'

export interface DropdownSelectOption {
  value: string
  label: string
}

export interface DropdownSelectProps {
  label: string
  value: string
  options: readonly DropdownSelectOption[]
  onChange: (value: string) => void
  /** Stretch to the container. Otherwise the control hugs its label. */
  fullWidth?: boolean
}

export const DropdownSelect = ({
  label,
  value,
  options,
  onChange,
  fullWidth = false,
}: DropdownSelectProps) => (
  <chakra.select
    aria-label={label}
    value={value}
    w={fullWidth ? 'full' : 'auto'}
    alignSelf={fullWidth ? 'stretch' : 'flex-start'}
    css={dropdownControlCss}
    onChange={(event) => {
      onChange(event.target.value)
    }}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </chakra.select>
)
