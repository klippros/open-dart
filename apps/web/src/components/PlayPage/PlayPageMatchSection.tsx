import { Heading, Stack, Text } from '@chakra-ui/react'
import { PlayPageModeGrid } from './PlayPageModeGrid'
import { MATCH_MODES } from './playPageModes'

export const PlayPageMatchSection = () => (
  <Stack gap={4}>
    <Stack gap={1}>
      <Heading as="h2" size="lg" color="white" fontFamily="Archivo Black, sans-serif">
        Match
      </Heading>
      <Text color="whiteAlpha.700" fontSize="sm" lineHeight="1.55">
        x01 legs with solo, guest, challenge, or online play where available.
      </Text>
    </Stack>
    <PlayPageModeGrid modes={MATCH_MODES} />
  </Stack>
)
