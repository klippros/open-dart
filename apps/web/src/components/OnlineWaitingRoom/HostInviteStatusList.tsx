import { HStack, Stack, Text } from '@chakra-ui/react'
import { inviteStatusLabel } from '../../lib/social/inviteApi'
import type { OnlineMatchInviteHostRow } from '../../lib/social/types'
import { TruncatedName } from '../TruncatedName/TruncatedName'

export interface HostInviteStatusListProps {
  invites: OnlineMatchInviteHostRow[]
}

export const HostInviteStatusList = ({ invites }: HostInviteStatusListProps) => {
  if (invites.length === 0) {
    return null
  }

  return (
    <Stack gap={1}>
      <Text color="whiteAlpha.700" fontSize="sm" fontWeight="semibold">
        Invited
      </Text>
      {invites.map((invite) => (
        <HStack key={invite.inviteId} gap={1} minW={0}>
          <TruncatedName name={invite.inviteeDisplayName} color="whiteAlpha.800" fontSize="sm" />
          <Text color="whiteAlpha.800" fontSize="sm" flexShrink={0}>
            — {inviteStatusLabel(invite.status)}
          </Text>
        </HStack>
      ))}
    </Stack>
  )
}
