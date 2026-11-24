import { Box, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  computeJdcChallengeSingleSessionStats,
  getJdcChallengeVisitDartPoints,
  getJdcChallengeVisitIsShanghai,
  getJdcChallengeVisitPart,
  getJdcChallengeVisitTargetLabel,
} from '@open-dart/analytics/jdcChallengeVisitStats'
import {
  getJdcChallengeGradeBand,
  getJdcChallengeShanghaiOutcome,
} from '@open-dart/game/jdcChallenge/jdcChallengeRules'
import { JdcChallengePart, JdcChallengeShanghaiOutcome } from '@open-dart/game/types/jdcChallenge'
import type { GameSession } from '@open-dart/game/types/gameSession'
import type { Visit } from '@open-dart/game/types/visit'
import { formatInteger } from '../../lib/analytics/formatAnalytics'
import {
  jdcChallengeGradeColor,
  jdcChallengeGradeTextColor,
} from '../../lib/jdcChallenge/jdcChallengeGradeColors'
import { StatCard } from './StatCard'

export interface JdcChallengeSummaryPanelProps {
  session: GameSession
}

const shanghaiOutcomeLabel = (outcome: JdcChallengeShanghaiOutcome): string => {
  switch (outcome) {
    case JdcChallengeShanghaiOutcome.Miss:
      return 'X'
    case JdcChallengeShanghaiOutcome.Single:
      return 'S'
    case JdcChallengeShanghaiOutcome.Double:
      return 'D'
    case JdcChallengeShanghaiOutcome.Triple:
      return 'T'
    default: {
      const exhaustive: never = outcome
      return String(exhaustive)
    }
  }
}

const formatShanghaiOutcomes = (visit: Visit): string => {
  const targetNumber = Number(getJdcChallengeVisitTargetLabel(visit))
  if (!Number.isFinite(targetNumber)) {
    return visit.darts.map(() => 'X').join(' ')
  }

  return visit.darts
    .map((dart) => shanghaiOutcomeLabel(getJdcChallengeShanghaiOutcome(dart, targetNumber)))
    .join(' ')
}

const ShanghaiRows = ({ visits, title }: { visits: Visit[]; title: string }) => (
  <Stack gap={2}>
    <Text fontSize="sm" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="0.08em">
      {title}
    </Text>
    <Stack gap={1}>
      {visits.map((visit) => {
        const targetLabel = getJdcChallengeVisitTargetLabel(visit) ?? '?'
        const isShanghai = getJdcChallengeVisitIsShanghai(visit)

        return (
          <Flex
            key={visit.visitIndex}
            justify="space-between"
            gap={3}
            borderBottomWidth="1px"
            borderColor="whiteAlpha.100"
            pb={1}
          >
            <Flex gap={2} align="center" minW="2.5rem">
              <Text color="whiteAlpha.800" fontSize="sm">
                {targetLabel}
              </Text>
              {isShanghai ? (
                <Box
                  as="span"
                  color="yellow.300"
                  fontSize="sm"
                  aria-label="Shanghai"
                  lineHeight="1"
                >
                  <FontAwesomeIcon
                    icon={faStar}
                    aria-hidden
                    style={{ height: '0.85em', width: '0.85em' }}
                  />
                </Box>
              ) : null}
            </Flex>
            <Flex gap={4} align="baseline">
              <Text color="whiteAlpha.800" fontSize="sm" fontFamily="mono" letterSpacing="0.08em">
                {formatShanghaiOutcomes(visit)}
              </Text>
              <Text
                color="white"
                fontSize="sm"
                fontWeight="semibold"
                minW="2.5rem"
                textAlign="right"
              >
                {visit.visitScore}
              </Text>
            </Flex>
          </Flex>
        )
      })}
    </Stack>
  </Stack>
)

const DoublesGrid = ({ visits }: { visits: Visit[] }) => (
  <Stack gap={2}>
    <Text fontSize="sm" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="0.08em">
      Doubles
    </Text>
    <SimpleGrid columns={7} gap={1.5}>
      {visits.flatMap((visit) => {
        const labels = (getJdcChallengeVisitTargetLabel(visit) ?? '').split(' · ')
        const points = getJdcChallengeVisitDartPoints(visit)

        return visit.darts.map((_, dartIndex) => {
          const label = labels[dartIndex] ?? `Dart ${dartIndex + 1}`
          const hit = (points[dartIndex] ?? 0) > 0

          return (
            <Box
              key={`${visit.visitIndex}-${label}`}
              borderRadius="6px"
              borderWidth="1px"
              borderColor={hit ? 'green.400' : 'whiteAlpha.200'}
              bg={hit ? 'green.500' : 'whiteAlpha.50'}
              color={hit ? 'white' : 'whiteAlpha.500'}
              px={1}
              py={1.5}
              textAlign="center"
            >
              <Text fontSize="xs" fontWeight="semibold" lineHeight="1">
                {label}
              </Text>
            </Box>
          )
        })
      })}
    </SimpleGrid>
  </Stack>
)

export const JdcChallengeSummaryPanel = ({ session }: JdcChallengeSummaryPanelProps) => {
  const stats = computeJdcChallengeSingleSessionStats(session)

  if (stats === null) {
    return null
  }

  const shanghaiLow = stats.visits.filter(
    (visit) => getJdcChallengeVisitPart(visit) === JdcChallengePart.ShanghaiLow,
  )
  const doubles = stats.visits.filter(
    (visit) => getJdcChallengeVisitPart(visit) === JdcChallengePart.Doubles,
  )
  const shanghaiHigh = stats.visits.filter(
    (visit) => getJdcChallengeVisitPart(visit) === JdcChallengePart.ShanghaiHigh,
  )
  const gradeBand = getJdcChallengeGradeBand(stats.grade)
  const gradeRange =
    gradeBand.maxScore === null
      ? `${gradeBand.minScore}+`
      : `${gradeBand.minScore}–${gradeBand.maxScore}`

  return (
    <Stack gap={5}>
      <Stack gap={3}>
        <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3}>
          <StatCard label="SH 10–15" value={formatInteger(stats.shanghaiLowScore)} />
          <StatCard label="Doubles" value={formatInteger(stats.doublesScore)} />
          <StatCard label="SH 15–20" value={formatInteger(stats.shanghaiHighScore)} />
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3}>
          <Box
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderRadius="lg"
            bg={jdcChallengeGradeColor(stats.grade)}
            color={jdcChallengeGradeTextColor(stats.grade)}
            px={5}
            py={4}
          >
            <Text fontSize="sm" opacity={0.85} mb={1}>
              {stats.gradeLabel}
            </Text>
            <Text fontFamily="Archivo Black, sans-serif" fontSize="2xl" lineHeight="1">
              {gradeRange}
            </Text>
          </Box>
          <StatCard label="Shanghais" value={formatInteger(stats.shanghaisHit)} />
          <StatCard label="Doubles hit" value={formatInteger(stats.doublesHit)} />
        </SimpleGrid>
      </Stack>

      <ShanghaiRows visits={shanghaiLow} title="Shanghai 10–15" />
      <DoublesGrid visits={doubles} />
      <ShanghaiRows visits={shanghaiHigh} title="Shanghai 15–20" />
    </Stack>
  )
}
