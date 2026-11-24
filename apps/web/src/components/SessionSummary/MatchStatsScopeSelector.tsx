import { Button, HStack, Stack, Text } from '@chakra-ui/react'
import { DropdownSelect } from '../DropdownSelect/DropdownSelect'

export type MatchStatsScope = 'match' | number

export interface MatchStatsScopeSelectorProps {
  legNumbers: number[]
  selectedScope: MatchStatsScope
  onScopeChange: (scope: MatchStatsScope) => void
}

const scopeButtonStyle = (isSelected: boolean) =>
  isSelected
    ? { variant: 'emphasis' as const }
    : { variant: 'ghost' as const, color: 'whiteAlpha.800' }

export const MatchStatsScopeSelector = ({
  legNumbers,
  selectedScope,
  onScopeChange,
}: MatchStatsScopeSelectorProps) => {
  if (legNumbers.length <= 1) {
    return null
  }

  const options: { scope: MatchStatsScope; label: string }[] = [
    { scope: 'match', label: 'Match' },
    ...legNumbers.map((legNumber) => ({
      scope: legNumber,
      label: `Leg ${legNumber}`,
    })),
  ]

  if (legNumbers.length > 5) {
    return (
      <Stack gap={2}>
        <Text fontSize="sm" color="whiteAlpha.700">
          Stats for
        </Text>
        <DropdownSelect
          label="Stats for"
          fullWidth
          value={String(selectedScope)}
          options={options.map((option) => ({
            value: String(option.scope),
            label: option.label,
          }))}
          onChange={(value) => {
            onScopeChange(value === 'match' ? 'match' : Number(value))
          }}
        />
      </Stack>
    )
  }

  return (
    <HStack gap={2} flexWrap="wrap">
      {options.map((option) => {
        const isSelected = selectedScope === option.scope

        return (
          <Button
            key={String(option.scope)}
            size="sm"
            {...scopeButtonStyle(isSelected)}
            onClick={() => {
              onScopeChange(option.scope)
            }}
          >
            {option.label}
          </Button>
        )
      })}
    </HStack>
  )
}
