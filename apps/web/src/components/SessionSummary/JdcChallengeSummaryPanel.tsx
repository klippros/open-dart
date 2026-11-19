import { Box, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import {
  computeJdcChallengeSingleSessionStats,
  getJdcChallengeVisitDartPoints,
  getJdcChallengeVisitIsShanghai,
  getJdcChallengeVisitPart,
  getJdcChallengeVisitShanghaiBonus,
  getJdcChallengeVisitTargetLabel,
} from '@open-dart/analytics/jdcChallengeVisitStats'
import { JDC_CHALLENGE_MAX_SHANGHAIS } from '@open-dart/game/jdcChallenge/jdcChallengeRules'
import { JdcChallengePart } from '@open-dart/game/types/jdcChallenge'
import type { GameSession } from '@open-dart/game/types/gameSession'
import type { Visit } from '@open-dart/game/types/visit'
import { formatInteger } from '../../lib/analytics/formatAnalytics'
import {
  jdcChallengeGradeColor,
  jdcChallengeGradeTextColor,
} from '../../lib/jdcChallenge/jdcChallengeGradeColors'
import { StatCard } from '../StatsPageSections/StatCard'

export interface JdcChallengeSummaryPanelProps {
  session: GameSession
}

const formatDartPoints = (visit: Visit): string => {
  const points = getJdcChallengeVisitDartPoints(visit)
  return points.map((value) => (value > 0 ? String(value) : '–')).join(' · ')
}

const ShanghaiRows = ({ visits, title }: { visits: Visit[]; title: string }) => (
  <Stack gap={2}>
    <Text fontSize="sm" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="0.08em">
      {title}
    </Text>
    <Stack gap={1}>
      {visits.map((visit) => {
        const targetLabel = getJdcChallengeVisitTargetLabel(visit) ?? '?'
        const bonus = getJdcChallengeVisitShanghaiBonus(visit)
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
            <Text color="whiteAlpha.800" fontSize="sm">
              {targetLabel}
              {isShanghai ? ' · Shanghai' : ''}
            </Text>
            <Text color="white" fontSize="sm" fontWeight="semibold">
              {formatDartPoints(visit)}
              {bonus > 0 ? ` +${bonus}` : ''}
              {` = ${visit.visitScore}`}
            </Text>
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
    <SimpleGrid columns={{ base: 3, sm: 4 }} gap={2}>
      {visits.flatMap((visit) => {
        const labels = (getJdcChallengeVisitTargetLabel(visit) ?? '').split(' · ')
        const points = getJdcChallengeVisitDartPoints(visit)

        return visit.darts.map((_, dartIndex) => {
          const label = labels[dartIndex] ?? `Dart ${dartIndex + 1}`
          const scored = points[dartIndex] ?? 0

          return (
            <Box
              key={`${visit.visitIndex}-${label}`}
              borderRadius="10px"
              borderWidth="1px"
              borderColor={scored > 0 ? 'green.400' : 'whiteAlpha.200'}
              bg={scored > 0 ? 'whiteAlpha.100' : 'whiteAlpha.50'}
              px={2}
              py={2}
              textAlign="center"
            >
              <Text fontSize="xs" color="whiteAlpha.600">
                {label}
              </Text>
              <Text color="white" fontWeight="semibold" fontSize="sm">
                {scored > 0 ? scored : '–'}
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

  return (
    <Stack gap={5}>
      <Flex
        align="center"
        justify="space-between"
        gap={3}
        px={4}
        py={3}
        borderRadius="14px"
        bg={jdcChallengeGradeColor(stats.grade)}
        color={jdcChallengeGradeTextColor(stats.grade)}
      >
        <Stack gap={0}>
          <Text fontSize="sm" opacity={0.85}>
            Grade
          </Text>
          <Text fontFamily="Archivo Black, sans-serif" fontSize="2xl" lineHeight="1">
            {stats.gradeLabel}
          </Text>
        </Stack>
        <Text fontFamily="Archivo Black, sans-serif" fontSize="4xl" lineHeight="1">
          {stats.score}
        </Text>
      </Flex>

      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
        <StatCard label="SH 10–15" value={formatInteger(stats.shanghaiLowScore)} />
        <StatCard label="Doubles" value={formatInteger(stats.doublesScore)} />
        <StatCard label="SH 15–20" value={formatInteger(stats.shanghaiHighScore)} />
        <StatCard
          label="Shanghais"
          value={`${stats.shanghaisHit}/${JDC_CHALLENGE_MAX_SHANGHAIS}`}
        />
        <StatCard label="Doubles hit" value={formatInteger(stats.doublesHit)} />
      </SimpleGrid>

      <ShanghaiRows visits={shanghaiLow} title="Shanghai 10–15" />
      <DoublesGrid visits={doubles} />
      <ShanghaiRows visits={shanghaiHigh} title="Shanghai 15–20" />
    </Stack>
  )
}
