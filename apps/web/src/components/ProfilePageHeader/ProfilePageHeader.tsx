import { Box, Flex, Stack } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { ProfileJdcChallengeBadge } from '@open-dart/analytics'
import { ProfileJdcJersey } from '../ProfileJdcJersey/ProfileJdcJersey'

export interface ProfilePageHeaderProps {
  jersey: ProfileJdcChallengeBadge | null
  identity: ReactNode
  social?: ReactNode
  /** Left side of the second row, such as the darts count. */
  meta?: ReactNode
  dateControl: ReactNode
  children?: ReactNode
}

export const ProfilePageHeader = ({
  jersey,
  identity,
  social,
  meta,
  dateControl,
  children,
}: ProfilePageHeaderProps) => (
  <Stack gap={3}>
    <Flex align="center" justify="space-between" gap={4} flexWrap="wrap">
      <Box
        display="grid"
        gridTemplateColumns={
          jersey !== null ? 'auto minmax(0, max-content)' : 'minmax(0, max-content)'
        }
        alignItems="center"
        columnGap={2}
        minW={0}
        flex="1 1 auto"
      >
        {jersey !== null ? <ProfileJdcJersey badge={jersey} /> : null}
        <Box minW={0}>{identity}</Box>
      </Box>
      {social}
    </Flex>
    <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
      {meta}
      <Box ml="auto" flexShrink={0}>
        {dateControl}
      </Box>
    </Flex>
    {children}
  </Stack>
)
