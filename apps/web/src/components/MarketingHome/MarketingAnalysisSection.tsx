import { Box, Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { ProfileStatCardGrid } from '../ProfileStatCards/ProfileStatCardGrid'
import { StatTimelineChart } from '../StatTimelineDialog/StatTimelineChart'
import {
  buildMarketingProfileStatCards,
  MARKETING_DEMO_ADD_MS,
  MARKETING_DEMO_HOLD_MS,
  MARKETING_DEMO_SESSION_COUNT,
  MARKETING_DEMO_START_COUNT,
  MARKETING_DEMO_TIMELINE_POINTS,
} from './marketingDemoData'
import { MARKETING_CONTENT_MAX_WIDTH } from './marketingGraphicChrome'

/** Profile Average / Avg to 170 / Checkouts + growing Average chart (50→100). */
export const MarketingAnalysisSection = () => {
  const [visibleCount, setVisibleCount] = useState(MARKETING_DEMO_START_COUNT)

  useEffect(() => {
    let timeoutId = 0
    let count = MARKETING_DEMO_START_COUNT

    const schedule = () => {
      const delay =
        count >= MARKETING_DEMO_SESSION_COUNT ? MARKETING_DEMO_HOLD_MS : MARKETING_DEMO_ADD_MS

      timeoutId = window.setTimeout(() => {
        count = count >= MARKETING_DEMO_SESSION_COUNT ? MARKETING_DEMO_START_COUNT : count + 1
        setVisibleCount(count)
        schedule()
      }, delay)
    }

    schedule()
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [])

  const cards = buildMarketingProfileStatCards(visibleCount)
  const points = MARKETING_DEMO_TIMELINE_POINTS.slice(0, visibleCount)

  return (
    <Stack
      className="marketing-fade-in"
      style={{ animationDelay: '0.22s' }}
      gap={5}
      align="center"
      w="full"
      maxW={MARKETING_CONTENT_MAX_WIDTH}
    >
      <Box w="full">
        <ProfileStatCardGrid cards={cards} columns={3} />
      </Box>

      <Box
        borderRadius="lg"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        bg="whiteAlpha.50"
        p={{ base: 3, md: 4 }}
        overflow="hidden"
        w="full"
      >
        <Text fontSize="sm" color="whiteAlpha.700" mb={2} px={1}>
          Average
        </Text>
        <StatTimelineChart points={points} format="average" />
      </Box>
    </Stack>
  )
}
