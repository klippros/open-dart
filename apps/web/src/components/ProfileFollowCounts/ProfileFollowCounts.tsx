import { Button, HStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { getMyFollowCounts } from '../../lib/social/followApi'
import type { MyFollowCounts } from '../../lib/social/followApi'
import { FollowListKind, formatFollowCountLabel } from '../../lib/social/followListKind'
import { ProfileFollowListDialog } from '../ProfileFollowListDialog/ProfileFollowListDialog'

const FOLLOW_LIST_KINDS = [FollowListKind.Followers, FollowListKind.Following] as const

export const ProfileFollowCounts = () => {
  const [counts, setCounts] = useState<MyFollowCounts | null>(null)
  const [openList, setOpenList] = useState<FollowListKind | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const next = await getMyFollowCounts()
        if (!cancelled) {
          setCounts(next)
        }
      } catch {
        if (!cancelled) {
          setCounts(null)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <HStack gap={1} flexWrap="wrap">
        {FOLLOW_LIST_KINDS.map((kind) => {
          const count =
            kind === FollowListKind.Followers ? counts?.followerCount : counts?.followingCount

          return (
            <Button
              key={kind}
              variant="ghost"
              size="sm"
              color="whiteAlpha.800"
              fontWeight="normal"
              px={2}
              _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
              onClick={() => {
                setOpenList(kind)
              }}
            >
              {formatFollowCountLabel(kind, count ?? 0)}
            </Button>
          )
        })}
      </HStack>
      <ProfileFollowListDialog
        kind={openList}
        onClose={() => {
          setOpenList(null)
        }}
      />
    </>
  )
}
