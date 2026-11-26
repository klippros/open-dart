import { Box, Button, Heading, Stack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { MarketingDartBoardGraphic } from './MarketingDartBoardGraphic'
import { MarketingNinetyNineGraphic } from './MarketingNinetyNineGraphic'
import { MARKETING_SECTION_GAP } from './marketingGraphicChrome'

export const MarketingHero = () => (
  <Stack
    className="marketing-fade-in"
    gap={0}
    align="center"
    textAlign="center"
    w="full"
    position="relative"
    zIndex={1}
  >
    <Heading
      as="h1"
      fontSize={{ base: '2rem', sm: '2.6rem', md: '3.4rem' }}
      lineHeight="1.12"
      color="white"
      fontFamily="Archivo Black, sans-serif"
      letterSpacing="-0.03em"
      maxW="22ch"
      position="relative"
      zIndex={1}
    >
      Easy practice scoring, matches, and progress tracking
    </Heading>

    <Box h={MARKETING_SECTION_GAP} flexShrink={0} aria-hidden="true" />

    {/* Board vertical center aligns with the CTA */}
    <Box position="relative" w="full" display="flex" justifyContent="center">
      <MarketingDartBoardGraphic />
      <Button
        asChild
        variant="emphasis"
        size="lg"
        fontSize={{ base: '1.35rem', md: '1.65rem' }}
        fontFamily="Archivo Black, sans-serif"
        letterSpacing="-0.02em"
        px={{ base: 10, md: 12 }}
        h="auto"
        minH={{ base: '3.5rem', md: '4rem' }}
        borderRadius="14px"
        position="relative"
        zIndex={1}
      >
        <RouterLink to="/play">Start playing</RouterLink>
      </Button>
    </Box>

    {/* Gap between CTA and modes — 99 Darts vertical center */}
    <Box position="relative" w="full" h={MARKETING_SECTION_GAP} flexShrink={0}>
      <MarketingNinetyNineGraphic />
    </Box>
  </Stack>
)
