import { HStack, Input, Text } from '@chakra-ui/react'

interface MarketingTransformFieldProps {
  label: string
  value: number
  suffix: string
  onChange: (value: number) => void
}

export const MarketingTransformField = ({
  label,
  value,
  suffix,
  onChange,
}: MarketingTransformFieldProps) => (
  <HStack gap={2} align="center">
    <Text w="14px" fontSize="11px" color="whiteAlpha.700" fontWeight="600">
      {label}
    </Text>
    <Input
      type="number"
      step="0.01"
      value={value}
      onChange={(event) => {
        const next = Number(event.target.value)
        if (Number.isFinite(next)) {
          onChange(next)
        }
      }}
      size="xs"
      bg="#3a3a3a"
      borderColor="transparent"
      color="white"
      borderRadius="6px"
      h="28px"
      px={2}
      fontSize="12px"
      _focusVisible={{ borderColor: '#0d99ff', outline: 'none' }}
    />
    <Text fontSize="11px" color="whiteAlpha.500" w="14px">
      {suffix}
    </Text>
  </HStack>
)
