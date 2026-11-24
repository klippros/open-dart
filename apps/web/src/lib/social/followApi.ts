import { supabaseClient } from '../supabase/client'

export class FollowApiError extends Error {
  readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'FollowApiError'
    this.code = code
  }
}

export interface MyFollowCounts {
  followerCount: number
  followingCount: number
}

export interface MyFollowListEntry {
  userId: string
  displayName: string
}

export interface ListMyFollowsOptions {
  limit?: number
  afterDisplayName?: string
  afterUserId?: string
}

const mapFollowError = (message: string): FollowApiError => {
  if (message.includes('rate limited')) {
    return new FollowApiError('Too many follow requests. Try again shortly.', 'rate_limited')
  }
  if (message.includes('follow limit reached')) {
    return new FollowApiError('You have reached the follow limit.', 'follow_limit')
  }
  if (message.includes('not allowed')) {
    return new FollowApiError('Unable to follow this player.', 'not_allowed')
  }
  if (message.includes('invalid cursor')) {
    return new FollowApiError('Unable to load that follow page.', 'invalid_cursor')
  }
  return new FollowApiError('Unable to update follow status.', 'unknown')
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const parseFollowListEntry = (value: unknown): MyFollowListEntry | null => {
  if (!isRecord(value)) {
    return null
  }

  const userId = value.user_id
  const displayName = value.display_name
  if (typeof userId !== 'string' || typeof displayName !== 'string') {
    return null
  }

  return { userId, displayName }
}

const parseFollowCounts = (value: unknown): MyFollowCounts | null => {
  const row: unknown = Array.isArray(value) ? value[0] : value
  if (!isRecord(row)) {
    return null
  }

  const followerCount = row.follower_count
  const followingCount = row.following_count
  if (typeof followerCount !== 'number' || typeof followingCount !== 'number') {
    return null
  }

  return { followerCount, followingCount }
}

export const isFollowingUser = async (followeeUserId: string): Promise<boolean> => {
  if (supabaseClient === null) {
    return false
  }

  const result = await supabaseClient.rpc('is_following_user', {
    p_followee_id: followeeUserId,
  })

  if (result.error !== null) {
    return false
  }

  return result.data === true
}

export const followUser = async (followeeUserId: string): Promise<void> => {
  if (supabaseClient === null) {
    throw new FollowApiError('Supabase is not configured', 'not_configured')
  }

  const result = await supabaseClient.rpc('follow_user', {
    p_followee_id: followeeUserId,
  })

  if (result.error !== null) {
    throw mapFollowError(result.error.message)
  }
}

export const unfollowUser = async (followeeUserId: string): Promise<void> => {
  if (supabaseClient === null) {
    throw new FollowApiError('Supabase is not configured', 'not_configured')
  }

  const result = await supabaseClient.rpc('unfollow_user', {
    p_followee_id: followeeUserId,
  })

  if (result.error !== null) {
    throw mapFollowError(result.error.message)
  }
}

export const getMyFollowCounts = async (): Promise<MyFollowCounts> => {
  if (supabaseClient === null) {
    throw new FollowApiError('Supabase is not configured', 'not_configured')
  }

  const result = await supabaseClient.rpc('get_my_follow_counts')

  if (result.error !== null) {
    throw mapFollowError(result.error.message)
  }

  const parsed = parseFollowCounts(result.data as unknown)
  if (parsed === null) {
    throw new FollowApiError('Unable to load follow counts.', 'unknown')
  }

  return parsed
}

const listMyFollowEntries = async (
  rpcName: 'list_my_followers' | 'list_my_following',
  options: ListMyFollowsOptions = {},
): Promise<MyFollowListEntry[]> => {
  if (supabaseClient === null) {
    throw new FollowApiError('Supabase is not configured', 'not_configured')
  }

  const result = await supabaseClient.rpc(rpcName, {
    p_limit: options.limit ?? 50,
    p_after_display_name: options.afterDisplayName ?? null,
    p_after_user_id: options.afterUserId ?? null,
  })

  if (result.error !== null) {
    throw mapFollowError(result.error.message)
  }

  const rows = result.data as unknown
  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map(parseFollowListEntry)
    .filter((entry): entry is MyFollowListEntry => entry !== null)
}

export const listMyFollowers = (options: ListMyFollowsOptions = {}): Promise<MyFollowListEntry[]> =>
  listMyFollowEntries('list_my_followers', options)

export const listMyFollowing = (options: ListMyFollowsOptions = {}): Promise<MyFollowListEntry[]> =>
  listMyFollowEntries('list_my_following', options)
