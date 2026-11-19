import { Badge, Box, Button, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import type { MatchSummaryHeader } from '../../lib/history/sessionSummary'
import { MatchSummaryTitle } from '../SessionSummary/MatchSummaryTitle'

export interface HistoryListItemProps {
  header: MatchSummaryHeader
  badgeLabel?: string
  opponentProfileTo?: string
  opponentName?: string
  onClick?: () => void
}

export const HistoryListItem = ({
  header,
  badgeLabel,
  opponentProfileTo,
  opponentName,
  onClick,
}: HistoryListItemProps) => {
  const content = (
    <Stack gap={1}>
      <MatchSummaryTitle
        header={header}
        badge={
          badgeLabel === undefined ? undefined : (
            <Badge colorPalette="orange" variant="subtle">
              {badgeLabel}
            </Badge>
          )
        }
      />
      {opponentProfileTo !== undefined && opponentName !== undefined ? (
        <Text fontSize="sm" color="orange.200">
          <RouterLink
            to={opponentProfileTo}
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            View {opponentName}
          </RouterLink>
        </Text>
      ) : null}
    </Stack>
  )

  if (onClick === undefined) {
    return (
      <Box
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        borderRadius="lg"
        bg="whiteAlpha.50"
        px={5}
        py={4}
      >
        {content}
      </Box>
    )
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      h="auto"
      w="full"
      display="block"
      textAlign="left"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      bg="whiteAlpha.50"
      px={5}
      py={4}
      cursor="pointer"
      fontWeight="normal"
      whiteSpace="normal"
      transition="border-color 0.15s ease, background 0.15s ease"
      _hover={{ borderColor: 'whiteAlpha.400', bg: 'whiteAlpha.100' }}
      _focusVisible={{ outline: '2px solid', outlineColor: 'orange.300', outlineOffset: '2px' }}
    >
      {content}
    </Button>
  )
}
