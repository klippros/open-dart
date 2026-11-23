import { Box, Stack, Text } from '@chakra-ui/react'
import type { ProfileJdcChallengeBadge as ProfileJdcChallengeBadgeData } from '@open-dart/analytics'
import { getJdcChallengeGradeLabel } from '@open-dart/game/jdcChallenge/jdcChallengeRules'
import {
  jdcChallengeGradeColor,
  jdcChallengeGradeTextColor,
} from '../../lib/jdcChallenge/jdcChallengeGradeColors'

export interface ProfileJdcChallengeBadgeProps {
  badge: ProfileJdcChallengeBadgeData
}

export const ProfileJdcChallengeBadge = ({ badge }: ProfileJdcChallengeBadgeProps) => {
  const fill = jdcChallengeGradeColor(badge.grade)
  const text = jdcChallengeGradeTextColor(badge.grade)

  return (
    <Box
      position="relative"
      overflow="hidden"
      borderRadius="16px"
      px={4}
      py={3}
      minW="9rem"
      bg={fill}
      color={text}
      borderWidth="1px"
      borderColor="whiteAlpha.300"
    >
      <Stack gap={0} position="relative">
        <Text fontSize="xs" opacity={0.85} lineHeight="1.2">
          This month
        </Text>
        <Text fontFamily="Archivo Black, sans-serif" fontSize="xl" lineHeight="1.1">
          {getJdcChallengeGradeLabel(badge.grade)}
        </Text>
        <Text fontFamily="Archivo Black, sans-serif" fontSize="3xl" lineHeight="1">
          {badge.score}
        </Text>
      </Stack>
    </Box>
  )
}
