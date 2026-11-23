import { Button, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SetupPageActions } from '../components/SetupPageLayout/SetupPageActions'
import { SetupPageHeader } from '../components/SetupPageLayout/SetupPageHeader'
import { SetupPageLayout } from '../components/SetupPageLayout/SetupPageLayout'
import { SetupSection } from '../components/SetupPageLayout/SetupSection'
import { BigNumbersRequiredHits } from '@open-dart/game/types/bigNumbers'
import type { BigNumbersConfig } from '@open-dart/game/types/bigNumbers'
import {
  buildBigNumbersGamePath,
  getBigNumbersRequiredHitsDescription,
  getBigNumbersRequiredHitsLabel,
} from '@open-dart/game/bigNumbers/bigNumbersConfig'

const REQUIRED_HITS_OPTIONS = [
  BigNumbersRequiredHits.Zero,
  BigNumbersRequiredHits.One,
  BigNumbersRequiredHits.Two,
  BigNumbersRequiredHits.Three,
] as const

const HitsButton = ({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) => (
  <Button
    type="button"
    variant="ghost"
    onClick={onSelect}
    h="auto"
    py={4}
    borderWidth="2px"
    borderColor={selected ? 'orange.300' : 'whiteAlpha.200'}
    borderRadius="lg"
    bg={selected ? 'rgba(246, 173, 85, 0.14)' : 'whiteAlpha.50'}
    color="white"
    fontWeight="semibold"
    _hover={{
      borderColor: selected ? 'orange.200' : 'whiteAlpha.400',
      bg: selected ? 'rgba(246, 173, 85, 0.2)' : 'whiteAlpha.100',
    }}
  >
    {label}
  </Button>
)

export const BigNumbersSetupPage = () => {
  const navigate = useNavigate()
  const [requiredHits, setRequiredHits] = useState<BigNumbersRequiredHits>(
    BigNumbersRequiredHits.One,
  )

  const handleStart = () => {
    const config: BigNumbersConfig = { requiredHits }

    void navigate(buildBigNumbersGamePath(config))
  }

  return (
    <SetupPageLayout>
      <Stack gap={8}>
        <SetupPageHeader
          title="Big Numbers"
          description="Climb from 1 to 20. Hit enough darts into the number to advance, or go back one."
        />

        <SetupSection title="Hits to advance">
          <SimpleGrid columns={{ base: 2, sm: 4 }} gap={2}>
            {REQUIRED_HITS_OPTIONS.map((option) => (
              <HitsButton
                key={option}
                label={getBigNumbersRequiredHitsLabel(option)}
                selected={requiredHits === option}
                onSelect={() => {
                  setRequiredHits(option)
                }}
              />
            ))}
          </SimpleGrid>
          <Text fontSize="sm" color="whiteAlpha.700" mt={2}>
            {getBigNumbersRequiredHitsDescription(requiredHits)}. Any segment of the number counts.
          </Text>
        </SetupSection>

        <SetupPageActions
          primaryLabel="Start game"
          onBack={() => void navigate('/')}
          onPrimary={handleStart}
        />
      </Stack>
    </SetupPageLayout>
  )
}
