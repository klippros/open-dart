import { Box, Switch, Text } from '@chakra-ui/react'
import { useId } from 'react'

export interface SettingsSwitchRowProps {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}

export const SettingsSwitchRow = ({
  label,
  description,
  checked,
  disabled = false,
  onCheckedChange,
}: SettingsSwitchRowProps) => {
  const descriptionId = useId()

  return (
    <Switch.Root
      checked={checked}
      disabled={disabled}
      colorPalette="orange"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap={4}
      w="full"
      onCheckedChange={(details) => {
        onCheckedChange(details.checked)
      }}
    >
      <Box flex="1" minW={0}>
        <Switch.Label fontSize="sm" fontWeight="medium" color="white">
          {label}
        </Switch.Label>
        <Text id={descriptionId} fontSize="xs" color="whiteAlpha.600" lineHeight="1.4">
          {description}
        </Text>
      </Box>
      <Switch.HiddenInput aria-describedby={descriptionId} />
      <Switch.Control flexShrink={0}>
        <Switch.Thumb />
      </Switch.Control>
    </Switch.Root>
  )
}
