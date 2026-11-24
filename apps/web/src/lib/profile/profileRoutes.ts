export const OWN_PROFILE_PATH = '/profile'

/** Paths that used to be their own pages and now land on the own profile. */
export const LEGACY_PROFILE_PATHS = ['/history', '/stats'] as const

export const getPlayerProfilePath = (userId: string): string => `/players/${userId}`

/** Signed-out users stay on `/profile`. A signed-in id is a shareable player link. */
export const getOwnProfilePath = (userId: string | null | undefined): string =>
  userId === null || userId === undefined || userId.length === 0
    ? OWN_PROFILE_PATH
    : getPlayerProfilePath(userId)

export const isOwnProfileUserId = (
  routeUserId: string | undefined,
  viewerUserId: string | null | undefined,
): boolean =>
  routeUserId !== undefined &&
  viewerUserId !== null &&
  viewerUserId !== undefined &&
  routeUserId === viewerUserId
