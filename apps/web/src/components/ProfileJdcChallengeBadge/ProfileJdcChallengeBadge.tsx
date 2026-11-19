import { Box, Stack, Text } from '@chakra-ui/react'
import type { ProfileJdcChallengeBadge as ProfileJdcChallengeBadgeData } from '@open-dart/analytics'
import {
  getJdcChallengeGradeLabel,
  isHigherJdcChallengeGrade,
} from '@open-dart/game/jdcChallenge/jdcChallengeRules'
import {
  jdcChallengeGradeColor,
  jdcChallengeGradeTextColor,
} from '../../lib/jdcChallenge/jdcChallengeGradeColors'

export interface ProfileJdcChallengeBadgeProps {
  badge: ProfileJdcChallengeBadgeData
}

export const ProfileJdcChallengeBadge = ({ badge }: ProfileJdcChallengeBadgeProps) => {
  const showBestEverStripes = isHigherJdcChallengeGrade(badge.bestEverGrade, badge.grade)
  const bestEverColor = jdcChallengeGradeColor(badge.bestEverGrade)
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
      opacity={badge.isCurrentMonth ? 1 : 0.45}
      borderWidth="1px"
      borderColor="whiteAlpha.300"
    >
      {showBestEverStripes ? (
        <Box
          aria-hidden="true"
          position="absolute"
          inset={0}
          opacity={0.55}
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 8px,
              ${bestEverColor} 8px,
              ${bestEverColor} 14px
            )`,
          }}
        />
      ) : null}
      <Stack gap={0} position="relative">
        <Text fontSize="xs" opacity={0.85} lineHeight="1.2">
          {badge.isCurrentMonth ? 'This month' : 'Last score'}
        </Text>
        <Text fontFamily="Archivo Black, sans-serif" fontSize="xl" lineHeight="1.1">
          {getJdcChallengeGradeLabel(badge.grade)}
        </Text>
        <Text fontFamily="Archivo Black, sans-serif" fontSize="3xl" lineHeight="1">
          {badge.score}
        </Text>
        {showBestEverStripes ? (
          <Text fontSize="xs" opacity={0.9} mt={1}>
            Best ever {getJdcChallengeGradeLabel(badge.bestEverGrade)}
          </Text>
        ) : null}
      </Stack>
    </Box>
  )
}
