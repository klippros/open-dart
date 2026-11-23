import { Box, Text, chakra } from '@chakra-ui/react'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import {
  jdcChallengeGradeColor,
  jdcChallengeGradeTextColor,
} from '../../lib/jdcChallenge/jdcChallengeGradeColors'
import type { ProfileStatCardModel } from '../../lib/profile/profileCards'

export interface ProfileStatCardProps {
  card: ProfileStatCardModel
  empty?: boolean
  onStatSelect?: (selection: StatTimelineSelection) => void
}

const focusRing = { outline: '2px solid', outlineColor: 'orange.300', outlineOffset: '2px' }

export const ProfileStatCard = ({ card, empty = false, onStatSelect }: ProfileStatCardProps) => {
  const tone = !empty && card.grade !== null ? card.grade : null
  const bg = tone === null ? 'whiteAlpha.50' : jdcChallengeGradeColor(tone)
  const color = tone === null ? 'white' : jdcChallengeGradeTextColor(tone)
  const mutedColor = tone === null ? 'whiteAlpha.700' : color
  const mainTimeline = empty ? null : card.timeline
  const isMainClickable = onStatSelect !== undefined && mainTimeline !== null

  const mainContent = (
    <>
      <Text fontSize="sm" color={mutedColor} mb={1}>
        {card.label}
      </Text>
      <Text color={color} fontFamily="Archivo Black, sans-serif" fontSize="2xl" lineHeight="1">
        {empty ? '—' : card.value}
      </Text>
    </>
  )

  return (
    <Box
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      bg={bg}
      color={color}
      px={4}
      py={3}
      opacity={empty ? 0.45 : 1}
      transition="border-color 0.15s ease, filter 0.15s ease"
      _hover={isMainClickable ? { borderColor: 'whiteAlpha.400', filter: 'brightness(1.08)' } : {}}
    >
      {isMainClickable ? (
        <chakra.button
          type="button"
          display="block"
          w="full"
          textAlign="left"
          cursor="pointer"
          borderRadius="sm"
          _focusVisible={focusRing}
          onClick={() => {
            onStatSelect(mainTimeline)
          }}
        >
          {mainContent}
        </chakra.button>
      ) : (
        mainContent
      )}
      {empty
        ? null
        : card.details.map((detail) =>
            onStatSelect !== undefined && detail.timeline !== null ? (
              <chakra.button
                key={detail.id}
                type="button"
                display="block"
                mt={1}
                fontSize="sm"
                color={mutedColor}
                textAlign="left"
                cursor="pointer"
                textDecoration="underline"
                textDecorationStyle="dotted"
                textUnderlineOffset="3px"
                borderRadius="sm"
                _hover={{ color }}
                _focusVisible={focusRing}
                onClick={() => {
                  if (detail.timeline !== null) {
                    onStatSelect(detail.timeline)
                  }
                }}
              >
                {detail.text}
              </chakra.button>
            ) : (
              <Text key={detail.id} mt={1} fontSize="sm" color={mutedColor}>
                {detail.text}
              </Text>
            ),
          )}
    </Box>
  )
}
