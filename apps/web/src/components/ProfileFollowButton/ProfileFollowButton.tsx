import { Button, Popover, Portal, Stack, Text } from '@chakra-ui/react'
import { useEffect, useRef, useState } from 'react'
import {
  FollowApiError,
  followUser,
  isFollowingUser,
  unfollowUser,
} from '../../lib/social/followApi'
import { createRequestGeneration } from '../../lib/social/requestGeneration'
import { darkDialogContentProps } from '../darkDialogContentProps'
import { DropdownTrigger } from '../DropdownSelect/DropdownTrigger'
import { SettingsDismissBackdrop } from '../SettingsMenu/SettingsDismissBackdrop'

export interface ProfileFollowButtonProps {
  profileUserId: string
}

export const ProfileFollowButton = ({ profileUserId }: ProfileFollowButtonProps) => {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const requestGenerationRef = useRef(createRequestGeneration())

  useEffect(() => {
    const requestId = requestGenerationRef.current.next()
    setLoading(true)
    setError(null)
    setBusy(false)
    setMenuOpen(false)

    const load = async () => {
      const next = await isFollowingUser(profileUserId)
      if (!requestGenerationRef.current.isCurrent(requestId)) {
        return
      }
      setFollowing(next)
      setLoading(false)
    }

    void load()
  }, [profileUserId])

  const runFollowChange = async (nextFollowing: boolean) => {
    if (busy || loading || nextFollowing === following) {
      return
    }

    const requestId = requestGenerationRef.current.next()
    const previous = following
    setBusy(true)
    setError(null)
    setFollowing(nextFollowing)

    try {
      if (nextFollowing) {
        await followUser(profileUserId)
      } else {
        await unfollowUser(profileUserId)
      }
    } catch (changeError) {
      if (!requestGenerationRef.current.isCurrent(requestId)) {
        return
      }
      setFollowing(previous)
      setError(
        changeError instanceof FollowApiError
          ? changeError.message
          : 'Unable to update follow status.',
      )
    } finally {
      if (requestGenerationRef.current.isCurrent(requestId)) {
        setBusy(false)
      }
    }
  }

  const errorText =
    error !== null ? (
      <Text fontSize="sm" color="red.300">
        {error}
      </Text>
    ) : null

  if (loading || !following) {
    return (
      <Stack gap={2} align="start">
        <Button
          variant="emphasis"
          disabled={loading || busy}
          onClick={() => {
            void runFollowChange(true)
          }}
        >
          {loading ? '…' : 'Follow'}
        </Button>
        {errorText}
      </Stack>
    )
  }

  return (
    <Stack gap={2} align="start">
      <Popover.Root
        open={menuOpen}
        positioning={{ placement: 'bottom-start' }}
        onOpenChange={(details) => {
          setMenuOpen(details.open)
        }}
      >
        <Popover.Trigger asChild>
          <DropdownTrigger disabled={busy}>Following</DropdownTrigger>
        </Popover.Trigger>
        <Portal>
          {menuOpen && (
            <SettingsDismissBackdrop
              onDismiss={() => {
                setMenuOpen(false)
              }}
            />
          )}
          <Popover.Positioner css={{ '--z-index': 'zIndex.popover' }}>
            <Popover.Content
              bg={darkDialogContentProps.bg}
              borderWidth={darkDialogContentProps.borderWidth}
              borderColor={darkDialogContentProps.borderColor}
              color={darkDialogContentProps.color}
              borderRadius="xl"
              shadow="2xl"
              minW="160px"
              overflow="hidden"
              p={0}
              _focusVisible={{ outline: 'none' }}
            >
              <Popover.Body px={3} py={3}>
                <Button
                  variant="cancel"
                  w="full"
                  justifyContent="flex-start"
                  disabled={busy}
                  onClick={() => {
                    setMenuOpen(false)
                    void runFollowChange(false)
                  }}
                >
                  Unfollow
                </Button>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
      {errorText}
    </Stack>
  )
}
