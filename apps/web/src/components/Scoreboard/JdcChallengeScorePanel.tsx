import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import type {
  JdcChallengeLiveScoreMetric,
  JdcChallengeLiveStats,
} from '@open-dart/analytics/jdcChallengeVisitStats'
import {
  JDC_CHALLENGE_GRADE_BANDS,
  getJdcChallengeGradeBand,
} from '@open-dart/game/jdcChallenge/jdcChallengeRules'
import type { JdcChallengeGrade } from '@open-dart/game/types/jdcChallenge'
import {
  JDC_CHALLENGE_GRADE_COLORS,
  JDC_CHALLENGE_GRADE_TEXT_COLORS,
} from '../../lib/jdcChallenge/jdcChallengeGradeColors'

export interface JdcChallengeScorePanelProps {
  stats: JdcChallengeLiveStats
  metrics: JdcChallengeLiveScoreMetric[]
  isActive?: boolean
}

const PROGRESS_CEILING = 1400

const gradeFillRatio = (score: number, grade: JdcChallengeGrade): number => {
  const band = getJdcChallengeGradeBand(grade)
  const nextMin =
    band.maxScore === null ? PROGRESS_CEILING : Math.min(band.maxScore + 1, PROGRESS_CEILING)
  const span = Math.max(1, nextMin - band.minScore)
  return Math.min(1, Math.max(0, (score - band.minScore) / span))
}

export const JdcChallengeScorePanel = ({
  stats,
  metrics,
  isActive = true,
}: JdcChallengeScorePanelProps) => {
  const currentFill = gradeFillRatio(stats.score, stats.grade)
  const currentRank = JDC_CHALLENGE_GRADE_BANDS.findIndex((band) => band.grade === stats.grade)

  return (
    <Box
      px={4}
      py={4}
      borderRadius="16px"
      borderWidth="1px"
      borderColor={isActive ? 'whiteAlpha.500' : 'whiteAlpha.200'}
      bg={isActive ? 'whiteAlpha.100' : 'whiteAlpha.50'}
    >
      <Stack gap={4}>
        <Flex
          align="center"
          justify="space-between"
          gap={3}
          px={3}
          py={3}
          borderRadius="12px"
          bg={JDC_CHALLENGE_GRADE_COLORS[stats.grade]}
          color={JDC_CHALLENGE_GRADE_TEXT_COLORS[stats.grade]}
        >
          <Stack gap={0}>
            <Text fontSize="sm" opacity={0.85} lineHeight="1.2">
              Grade
            </Text>
            <Text fontFamily="Archivo Black, sans-serif" fontSize="2xl" lineHeight="1">
              {stats.gradeLabel}
            </Text>
          </Stack>
          <Text
            fontFamily="Archivo Black, sans-serif"
            fontSize={{ base: '4xl', sm: '5xl' }}
            lineHeight="1"
          >
            {stats.score}
          </Text>
        </Flex>

        <Flex h="10px" borderRadius="full" overflow="hidden" gap="1px" bg="blackAlpha.400">
          {JDC_CHALLENGE_GRADE_BANDS.map((band, index) => {
            const filled = index < currentRank ? 1 : index === currentRank ? currentFill : 0

            return (
              <Box key={band.grade} flex="1" position="relative" bg="whiteAlpha.200">
                <Box
                  position="absolute"
                  inset={0}
                  width={`${filled * 100}%`}
                  bg={JDC_CHALLENGE_GRADE_COLORS[band.grade]}
                />
              </Box>
            )
          })}
        </Flex>

        <Flex align="stretch" justify="space-between" gap={2} w="full" flexWrap="wrap">
          {metrics
            .filter((metric) => metric.label !== 'Score' && metric.label !== 'Grade')
            .map((metric) => (
              <Flex
                key={metric.label}
                direction="column"
                align="center"
                justify="center"
                flex="1"
                minW="4.5rem"
              >
                <Text
                  color="white"
                  fontFamily="Archivo Black, sans-serif"
                  fontSize={{ base: 'xl', sm: '2xl' }}
                  lineHeight="1"
                  textAlign="center"
                >
                  {metric.value}
                </Text>
                <Text
                  mt={1}
                  fontSize="xs"
                  color="whiteAlpha.600"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  {metric.label}
                </Text>
              </Flex>
            ))}
        </Flex>

        {stats.targetLabel !== null ? (
          <Text fontSize="sm" color="whiteAlpha.700" textAlign="center">
            Next: {stats.targetLabel}
          </Text>
        ) : null}
      </Stack>
    </Box>
  )
}
