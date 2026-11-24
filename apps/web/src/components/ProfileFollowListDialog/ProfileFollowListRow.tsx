import { Button, HStack, Link, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { getPlayerProfilePath } from '../../lib/profile/profileRoutes'
import { FollowApiError, unfollowUser } from '../../lib/social/followApi'
import type { MyFollowListEntry } from '../../lib/social/followApi'
import { TruncatedName } from '../TruncatedName/TruncatedName'

export interface ProfileFollowListRowProps {
  entry: MyFollowListEntry
  canUnfollow: boolean
  onNavigate: () => void
  onUnfollowed: (userId: string) => void
}

export const ProfileFollowListRow = ({
  entry,
  canUnfollow,
  onNavigate,
  onUnfollowed,
}: ProfileFollowListRowProps) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unfollow = async () => {
    if (busy) {
      return
    }

    setBusy(true)
    setError(null)

    try {
      await unfollowUser(entry.userId)
      onUnfollowed(entry.userId)
    } catch (changeError) {
      setBusy(false)
      setError(
        changeError instanceof FollowApiError
          ? changeError.message
          : 'Unable to update follow status.',
      )
    }
  }

  return (
    <Stack gap={1}>
      <HStack justify="space-between" gap={3} align="center" minW={0}>
        <Link
          asChild
          display="block"
          flex="1"
          minW={0}
          color="white"
          fontWeight="semibold"
          py={1}
          _hover={{ color: 'orange.200' }}
        >
          <RouterLink to={getPlayerProfilePath(entry.userId)} onClick={onNavigate}>
            <TruncatedName name={entry.displayName} w="full" color="inherit" fontWeight="inherit" />
          </RouterLink>
        </Link>
        {canUnfollow ? (
          <Button
            variant="cancel"
            size="sm"
            flexShrink={0}
            disabled={busy}
            aria-label={`Unfollow ${entry.displayName}`}
            onClick={() => {
              void unfollow()
            }}
          >
            Unfollow
          </Button>
        ) : null}
      </HStack>
      {error !== null ? (
        <Text fontSize="sm" color="red.300">
          {error}
        </Text>
      ) : null}
    </Stack>
  )
}
