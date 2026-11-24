import { describe, expect, it } from 'vitest'
import { FollowListKind, formatFollowCountLabel } from './followListKind'

describe('formatFollowCountLabel', () => {
  it('pluralises followers', () => {
    expect(formatFollowCountLabel(FollowListKind.Followers, 0)).toBe('0 Followers')
    expect(formatFollowCountLabel(FollowListKind.Followers, 1)).toBe('1 Follower')
    expect(formatFollowCountLabel(FollowListKind.Followers, 12)).toBe('12 Followers')
  })

  it('keeps following as a fixed noun', () => {
    expect(formatFollowCountLabel(FollowListKind.Following, 1)).toBe('1 Following')
  })
})
