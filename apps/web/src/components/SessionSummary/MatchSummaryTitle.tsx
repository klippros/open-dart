import { Stack, Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { MatchSummaryHeader } from '../../lib/history/sessionSummary'

export interface MatchSummaryTitleProps {
  header: MatchSummaryHeader
  badge?: ReactNode
}

export const MatchSummaryTitle = ({ header, badge }: MatchSummaryTitleProps) => (
  <Stack gap={1} w="full">
    <Stack direction="row" align="center" justify="space-between" gap={3} w="full">
      <Stack direction="row" align="center" gap={2} minW={0}>
        <Text fontWeight="semibold" color="white" truncate>
          {header.modeLabel}
        </Text>
        {badge}
      </Stack>
      {header.resultLabel !== null && (
        <Text fontWeight="semibold" color="white" flexShrink={0}>
          {header.resultLabel}
        </Text>
      )}
    </Stack>
    <Text fontSize="sm" color="whiteAlpha.600" fontWeight="normal">
      {header.completedAtLabel}
    </Text>
  </Stack>
)
