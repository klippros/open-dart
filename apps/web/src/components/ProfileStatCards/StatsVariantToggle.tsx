import { SegmentGroup } from '@chakra-ui/react'

export interface StatsVariantToggleItem {
  value: string
  label: string
  count: number
}

export interface StatsVariantToggleProps {
  items: StatsVariantToggleItem[]
  value: string
  onChange: (value: string) => void
}

export const StatsVariantToggle = ({ items, value, onChange }: StatsVariantToggleProps) => {
  if (items.length === 0) {
    return null
  }

  return (
    <SegmentGroup.Root
      size="sm"
      value={value}
      onValueChange={(details) => {
        if (details.value !== null) {
          onChange(details.value)
        }
      }}
      bg="whiteAlpha.100"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      p="1"
      w="fit-content"
      maxW="full"
      minW={0}
    >
      <SegmentGroup.Indicator bg="whiteAlpha.200" />
      <SegmentGroup.Items
        items={items.map((item) => ({
          value: item.value,
          label: `${item.label} (${item.count})`,
        }))}
        color="whiteAlpha.800"
        whiteSpace="nowrap"
        _checked={{ color: 'white', fontWeight: 'semibold' }}
      />
    </SegmentGroup.Root>
  )
}
