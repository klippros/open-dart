import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { MATCH_MODES, PRACTICE_MODES } from '../PlayPage/playPageModes'
import { MARKETING_MODES_MAX_WIDTH } from './marketingGraphicChrome'

const MODE_LABELS = [...MATCH_MODES, ...PRACTICE_MODES].map((mode) => mode.label)
const ROW_COUNT = 3

const ModeSequence = () => (
  <Flex as="span" align="center" gap={{ base: 8, md: 12 }} px={{ base: 4, md: 6 }} flexShrink={0}>
    {MODE_LABELS.map((label) => (
      <Text
        key={label}
        as="span"
        color="whiteAlpha.800"
        fontFamily="Archivo Black, sans-serif"
        fontSize={{ base: '1.15rem', md: '1.45rem' }}
        letterSpacing="-0.02em"
        lineHeight="1"
        whiteSpace="nowrap"
        userSelect="none"
      >
        {label}
      </Text>
    ))}
  </Flex>
)

const MarqueeRow = ({ rowIndex }: { rowIndex: number }) => (
  <Box className="marketing-marquee-mask" py={1}>
    <Box
      className="marketing-marquee-track"
      data-phase={String(rowIndex)}
      aria-hidden={rowIndex > 0 ? true : undefined}
    >
      {/* Identical sequences; phase shifts by width/3 via animation-delay */}
      <ModeSequence />
      <ModeSequence />
    </Box>
  </Box>
)

export const MarketingModesSection = () => (
  <Stack
    className="marketing-fade-in"
    style={{ animationDelay: '0.1s' }}
    gap={{ base: 4, md: 5 }}
    align="stretch"
    w="full"
    maxW={MARKETING_MODES_MAX_WIDTH}
    position="relative"
    zIndex={1}
    aria-label="Game modes"
  >
    {Array.from({ length: ROW_COUNT }, (_, rowIndex) => (
      <MarqueeRow key={rowIndex} rowIndex={rowIndex} />
    ))}
  </Stack>
)
