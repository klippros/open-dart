import { Badge, Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import { faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Link as RouterLink } from 'react-router-dom'
import type { MatchSummaryHeader } from '../../lib/history/sessionSummary'
import { MatchSummaryTitle } from '../SessionSummary/MatchSummaryTitle'

export interface HistoryListItemProps {
  header: MatchSummaryHeader
  badgeLabel?: string
  opponentProfileTo?: string
  opponentName?: string
  onClick?: () => void
  onDelete?: () => void
}

export const HistoryListItem = ({
  header,
  badgeLabel,
  opponentProfileTo,
  opponentName,
  onClick,
  onDelete,
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

  const summary =
    onClick === undefined ? (
      <Box flex="1" minW={0}>
        {content}
      </Box>
    ) : (
      <Button
        type="button"
        onClick={onClick}
        variant="ghost"
        h="auto"
        flex="1"
        minW={0}
        display="block"
        textAlign="left"
        px={0}
        py={0}
        cursor="pointer"
        fontWeight="normal"
        whiteSpace="normal"
        _hover={{ bg: 'transparent' }}
        _focusVisible={{ outline: '2px solid', outlineColor: 'orange.300', outlineOffset: '2px' }}
      >
        {content}
      </Button>
    )

  return (
    <HStack
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      bg="whiteAlpha.50"
      px={5}
      py={4}
      gap={3}
      align="center"
      transition="border-color 0.15s ease, background 0.15s ease"
      _hover={{ borderColor: 'whiteAlpha.400', bg: 'whiteAlpha.100' }}
    >
      {summary}
      {onDelete === undefined ? null : (
        <Button
          type="button"
          aria-label="Delete game"
          variant="ghost"
          color="whiteAlpha.700"
          minW="2.5rem"
          w="2.5rem"
          h="2.5rem"
          p={0}
          flexShrink={0}
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
          _hover={{ color: 'red.300', bg: 'whiteAlpha.100' }}
          _focusVisible={{ outline: '2px solid', outlineColor: 'orange.300', outlineOffset: '2px' }}
        >
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      )}
    </HStack>
  )
}
