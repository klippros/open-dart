import { Box, Text, chakra } from '@chakra-ui/react'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import {
  jdcChallengeGradeColor,
  jdcChallengeGradeTextColor,
} from '../../lib/jdcChallenge/jdcChallengeGradeColors'
import type {
  ProfileBestSource,
  ProfileStatCardModel,
  ProfileStatDetail,
} from '../../lib/profile/profileCards'

export interface ProfileStatCardProps {
  card: ProfileStatCardModel
  empty?: boolean
  onStatSelect?: (selection: StatTimelineSelection) => void
  /** Own profile only. Opens the session behind a Best line. */
  onOpenBest?: (source: ProfileBestSource) => void
}

const focusRing = { outline: '2px solid', outlineColor: 'orange.300', outlineOffset: '2px' }

export const ProfileStatCard = ({
  card,
  empty = false,
  onStatSelect,
  onOpenBest,
}: ProfileStatCardProps) => {
  const tone = !empty && card.grade !== null ? card.grade : null
  const bg = tone === null ? 'whiteAlpha.50' : jdcChallengeGradeColor(tone)
  const color = tone === null ? 'white' : jdcChallengeGradeTextColor(tone)
  const mutedColor = tone === null ? 'whiteAlpha.700' : color
  const mainTimeline = empty ? null : card.timeline
  const isClickable = onStatSelect !== undefined && mainTimeline !== null
  const linkedDetails = card.details.filter(
    (detail): detail is ProfileStatDetail & { source: ProfileBestSource } =>
      onOpenBest !== undefined && detail.source !== null && detail.source !== undefined,
  )
  const plainDetails = card.details.filter(
    (detail) => onOpenBest === undefined || detail.source === null || detail.source === undefined,
  )

  const content = (
    <>
      <Text fontSize="sm" color={mutedColor} mb={1}>
        {card.label}
      </Text>
      <Text color={color} fontFamily="Archivo Black, sans-serif" fontSize="2xl" lineHeight="1">
        {empty ? '—' : card.value}
      </Text>
      {empty
        ? null
        : plainDetails.map((detail) => (
            <Text key={detail.id} mt={1} fontSize="sm" color={mutedColor}>
              {detail.text}
            </Text>
          ))}
    </>
  )

  const bestLinks =
    empty || linkedDetails.length === 0 || onOpenBest === undefined
      ? null
      : linkedDetails.map((detail) => {
          const source = detail.source

          return (
            <chakra.button
              key={detail.id}
              type="button"
              w="full"
              mt={1}
              px={4}
              pb={3}
              fontSize="sm"
              color={mutedColor}
              textAlign="left"
              cursor="pointer"
              textDecoration="underline"
              textUnderlineOffset="3px"
              borderRadius="sm"
              _hover={{ color }}
              _focusVisible={focusRing}
              onClick={(event) => {
                event.stopPropagation()
                onOpenBest(source)
              }}
            >
              {detail.text}
            </chakra.button>
          )
        })

  const cardChrome = {
    flex: '1',
    w: 'full',
    h: 'full',
    borderWidth: '1px',
    borderColor: 'whiteAlpha.200',
    borderRadius: 'lg',
    bg,
    color,
    opacity: empty ? 0.45 : 1,
  }

  if (bestLinks !== null) {
    return (
      <Box
        {...cardChrome}
        display="flex"
        flexDirection="column"
        alignItems="stretch"
        minH="0"
        transition="border-color 0.15s ease, filter 0.15s ease"
        _hover={isClickable ? { borderColor: 'whiteAlpha.400', filter: 'brightness(1.08)' } : {}}
      >
        {isClickable && mainTimeline !== null ? (
          <chakra.button
            type="button"
            flex="1"
            w="full"
            px={4}
            pt={3}
            fontFamily="inherit"
            fontWeight="normal"
            lineHeight="inherit"
            whiteSpace="normal"
            textAlign="left"
            cursor="pointer"
            _focusVisible={focusRing}
            onClick={() => {
              onStatSelect(mainTimeline)
            }}
          >
            {content}
          </chakra.button>
        ) : (
          <Box flex="1" px={4} pt={3}>
            {content}
          </Box>
        )}
        {bestLinks}
      </Box>
    )
  }

  if (!isClickable || mainTimeline === null) {
    return (
      <Box {...cardChrome} px={4} py={3}>
        {content}
      </Box>
    )
  }

  return (
    <chakra.button
      type="button"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="flex-start"
      minH="0"
      px={4}
      py={3}
      fontFamily="inherit"
      fontWeight="normal"
      lineHeight="inherit"
      whiteSpace="normal"
      textAlign="left"
      cursor="pointer"
      transition="border-color 0.15s ease, filter 0.15s ease"
      _hover={{ borderColor: 'whiteAlpha.400', filter: 'brightness(1.08)' }}
      _focusVisible={focusRing}
      onClick={() => {
        onStatSelect(mainTimeline)
      }}
      {...cardChrome}
    >
      {content}
    </chakra.button>
  )
}
