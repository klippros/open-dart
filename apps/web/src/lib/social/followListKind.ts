export enum FollowListKind {
  Followers = 'followers',
  Following = 'following',
}

export const formatFollowCountLabel = (kind: FollowListKind, count: number): string => {
  if (kind === FollowListKind.Following) {
    return `${count} Following`
  }

  return `${count} ${count === 1 ? 'Follower' : 'Followers'}`
}
