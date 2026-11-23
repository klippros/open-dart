import { Flex, HStack, Stack } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import type { ProfileJdcChallengeBadge } from '@open-dart/analytics'
import { ProfileJdcJersey } from '../ProfileJdcJersey/ProfileJdcJersey'

export interface ProfilePageHeaderProps {
  jersey: ProfileJdcChallengeBadge | null
  identity: ReactNode
  social?: ReactNode
  dateControl: ReactNode
  children?: ReactNode
}

export const ProfilePageHeader = ({
  jersey,
  identity,
  social,
  dateControl,
  children,
}: ProfilePageHeaderProps) => (
  <Stack gap={2}>
    <Flex align="center" justify="space-between" gap={3} flexWrap="wrap">
      <HStack gap={3} flexWrap="wrap" minW={0}>
        {jersey !== null ? <ProfileJdcJersey badge={jersey} /> : null}
        {identity}
        {social}
      </HStack>
      {dateControl}
    </Flex>
    {children}
  </Stack>
)
