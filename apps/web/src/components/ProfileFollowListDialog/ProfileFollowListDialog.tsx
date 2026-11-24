import { Button, Dialog, Portal, Stack, Text } from '@chakra-ui/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FollowApiError, listMyFollowers, listMyFollowing } from '../../lib/social/followApi'
import type { MyFollowListEntry } from '../../lib/social/followApi'
import { FollowListKind } from '../../lib/social/followListKind'
import { createRequestGeneration } from '../../lib/social/requestGeneration'
import { darkDialogContentProps } from '../darkDialogContentProps'
import { ProfileFollowListRow } from './ProfileFollowListRow'

const FOLLOW_LIST_PAGE_SIZE = 50

export interface ProfileFollowListDialogProps {
  kind: FollowListKind | null
  onClose: () => void
  onUnfollowed?: () => void
}

const loadPage = (kind: FollowListKind, after: MyFollowListEntry | undefined) => {
  const options = {
    limit: FOLLOW_LIST_PAGE_SIZE,
    afterDisplayName: after?.displayName,
    afterUserId: after?.userId,
  }

  return kind === FollowListKind.Followers ? listMyFollowers(options) : listMyFollowing(options)
}

export const ProfileFollowListDialog = ({
  kind,
  onClose,
  onUnfollowed,
}: ProfileFollowListDialogProps) => {
  const [entries, setEntries] = useState<MyFollowListEntry[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestGenerationRef = useRef(createRequestGeneration())
  const entriesRef = useRef(entries)
  const hasMoreRef = useRef(hasMore)
  const kindRef = useRef(kind)
  kindRef.current = kind

  const fetchPage = useCallback(
    async (listKind: FollowListKind, after: MyFollowListEntry | undefined) => {
      const requestId = requestGenerationRef.current.next()
      setLoading(true)
      setError(null)

      try {
        const page = await loadPage(listKind, after)
        if (!requestGenerationRef.current.isCurrent(requestId)) {
          return
        }
        const nextEntries = after === undefined ? page : [...entriesRef.current, ...page]
        entriesRef.current = nextEntries
        hasMoreRef.current = page.length === FOLLOW_LIST_PAGE_SIZE
        setEntries(nextEntries)
        setHasMore(hasMoreRef.current)
      } catch (loadError) {
        if (!requestGenerationRef.current.isCurrent(requestId)) {
          return
        }
        hasMoreRef.current = false
        setHasMore(false)
        setError(
          loadError instanceof FollowApiError ? loadError.message : 'Unable to load this list.',
        )
      } finally {
        if (requestGenerationRef.current.isCurrent(requestId)) {
          setLoading(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    if (kind === null) {
      return
    }
    entriesRef.current = []
    hasMoreRef.current = false
    setEntries([])
    setHasMore(false)
    void fetchPage(kind, undefined)
  }, [fetchPage, kind])

  const handleUnfollowed = useCallback(
    (userId: string) => {
      const next = entriesRef.current.filter((entry) => entry.userId !== userId)
      entriesRef.current = next
      setEntries(next)
      onUnfollowed?.()

      const listKind = kindRef.current
      if (next.length === 0 && hasMoreRef.current && listKind !== null) {
        void fetchPage(listKind, undefined)
      }
    },
    [fetchPage, onUnfollowed],
  )

  const title = kind === FollowListKind.Following ? 'Following' : 'Followers'
  const emptyMessage =
    kind === FollowListKind.Following
      ? 'You are not following anyone yet.'
      : 'Nobody follows you yet.'

  return (
    <Dialog.Root
      open={kind !== null}
      placement="center"
      scrollBehavior="inside"
      onOpenChange={(details) => {
        if (!details.open) {
          onClose()
        }
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg={darkDialogContentProps.bg}
            borderWidth={darkDialogContentProps.borderWidth}
            borderColor={darkDialogContentProps.borderColor}
            color={darkDialogContentProps.color}
            shadow={darkDialogContentProps.shadow}
            maxW="24rem"
          >
            <Dialog.Header>
              <Dialog.Title color="white">{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={2}>
                {entries.map((entry) => (
                  <ProfileFollowListRow
                    key={entry.userId}
                    entry={entry}
                    canUnfollow={kind === FollowListKind.Following}
                    onNavigate={onClose}
                    onUnfollowed={handleUnfollowed}
                  />
                ))}
                {!loading && error === null && entries.length === 0 ? (
                  <Text fontSize="sm" color="whiteAlpha.700">
                    {emptyMessage}
                  </Text>
                ) : null}
                {loading ? (
                  <Text fontSize="sm" color="whiteAlpha.700">
                    Loading…
                  </Text>
                ) : null}
                {error !== null ? (
                  <Text fontSize="sm" color="red.300">
                    {error}
                  </Text>
                ) : null}
                {hasMore && !loading && kind !== null ? (
                  <Button
                    variant="cancel"
                    alignSelf="start"
                    onClick={() => {
                      void fetchPage(kind, entries.at(-1))
                    }}
                  >
                    More
                  </Button>
                ) : null}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="cancel">Close</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
