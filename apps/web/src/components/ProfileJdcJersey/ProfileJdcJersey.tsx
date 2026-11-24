import { Box, Portal, Stack, Text, Tooltip } from '@chakra-ui/react'
import type { ProfileJdcChallengeBadge } from '@open-dart/analytics'
import {
  getJdcChallengeGradeBand,
  getJdcChallengeGradeLabel,
} from '@open-dart/game/jdcChallenge/jdcChallengeRules'
import { jdcChallengeGradeColor } from '../../lib/jdcChallenge/jdcChallengeGradeColors'

export interface ProfileJdcJerseyProps {
  badge: ProfileJdcChallengeBadge
}

const JERSEY_PATH =
  'M8 2 L3.5 4.2 L1 9.5 L4.4 11.2 L5.5 9.6 L5.5 22 L18.5 22 L18.5 9.6 L19.6 11.2 L23 9.5 L20.5 4.2 L16 2 C15 4.2 9 4.2 8 2 Z'

export const ProfileJdcJersey = ({ badge }: ProfileJdcJerseyProps) => {
  const fill = jdcChallengeGradeColor(badge.grade)
  const gradeLabel = getJdcChallengeGradeLabel(badge.grade)
  const gradeBand = getJdcChallengeGradeBand(badge.grade)
  const gradeRange =
    gradeBand.maxScore === null
      ? `${gradeBand.minScore}+`
      : `${gradeBand.minScore}–${gradeBand.maxScore}`
  const description = `${gradeLabel} ${gradeRange}. High Score ${badge.score}. last 30 days`

  return (
    <Tooltip.Root openDelay={150} closeDelay={50}>
      <Tooltip.Trigger asChild>
        <Box
          as="span"
          role="img"
          aria-label={description}
          tabIndex={0}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          w="44px"
          h="44px"
          flexShrink={0}
          borderRadius="md"
          _focusVisible={{ outline: '2px solid', outlineColor: 'orange.300', outlineOffset: '2px' }}
        >
          <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
            <path
              d={JERSEY_PATH}
              fill={fill}
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="0.8"
            />
          </svg>
        </Box>
      </Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content bg="gray.900" color="white" px={3} py={2} borderRadius="md">
            <Stack gap={1}>
              <Text fontWeight="semibold">
                {gradeLabel} {gradeRange}
              </Text>
              <Text fontSize="sm">High Score {badge.score}</Text>
              <Text fontSize="xs" color="whiteAlpha.700">
                last 30 days
              </Text>
            </Stack>
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  )
}
