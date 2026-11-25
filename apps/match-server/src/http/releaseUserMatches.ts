import { readBearerToken } from '../auth/jwt'
import { isUuid } from '../ids'
import { isRecord } from '../json'
import { MatchStatus } from '../match/types'
import { jsonResponse } from './json'

const restHeaders = (serviceRoleKey: string): Headers => {
  const headers = new Headers()
  headers.set('apikey', serviceRoleKey)
  headers.set('Authorization', `Bearer ${serviceRoleKey}`)
  headers.set('Accept', 'application/json')
  return headers
}

const restUrl = (supabaseUrl: string, path: string): string =>
  `${supabaseUrl.replace(/\/$/u, '')}/rest/v1/${path}`

const timingSafeEqualString = (left: string, right: string): boolean => {
  if (left.length !== right.length) {
    return false
  }

  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return mismatch === 0
}

const isServiceRoleRequest = (request: Request, serviceRoleKey: string): boolean => {
  const bearer = readBearerToken(request)
  return bearer !== null && timingSafeEqualString(bearer, serviceRoleKey)
}

const listOpenMatchIds = async (env: Env, userId: string): Promise<string[]> => {
  if (env.SUPABASE_URL.length === 0 || env.SUPABASE_URL.includes('example.invalid')) {
    return []
  }

  const response = await fetch(
    restUrl(
      env.SUPABASE_URL,
      `online_match_players?select=match_id,online_matches!inner(status)&user_id=eq.${userId}&online_matches.status=in.(${MatchStatus.Waiting},${MatchStatus.Active})`,
    ),
    {
      method: 'GET',
      headers: restHeaders(env.SUPABASE_SERVICE_ROLE_KEY),
    },
  )

  if (!response.ok) {
    throw new Error(`Could not list open matches (${String(response.status)})`)
  }

  const body: unknown = await response.json()
  if (!Array.isArray(body)) {
    return []
  }

  const matchIds: string[] = []
  for (const row of body) {
    if (!isRecord(row) || typeof row.match_id !== 'string' || !isUuid(row.match_id)) {
      continue
    }

    matchIds.push(row.match_id)
  }

  return [...new Set(matchIds)]
}

export const releaseUserMatches = async (
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> => {
  if (!isServiceRoleRequest(request, env.SUPABASE_SERVICE_ROLE_KEY)) {
    return jsonResponse(request, { error: 'unauthorized' }, 401)
  }

  if (!isUuid(userId)) {
    return jsonResponse(request, { error: 'invalid_user_id' }, 400)
  }

  let matchIds: string[]

  try {
    matchIds = await listOpenMatchIds(env, userId)
  } catch {
    return jsonResponse(request, { error: 'index_unavailable' }, 503)
  }

  const released: string[] = []
  const failed: { matchId: string; code: string | null; message: string }[] = []

  for (const matchId of matchIds) {
    const stub = env.MATCH.getByName(matchId)
    const result = await stub.releaseForAccountDeletion(userId)

    if (result.ok) {
      released.push(matchId)
      continue
    }

    failed.push({
      matchId,
      code: result.code,
      message: result.message ?? 'release_failed',
    })
  }

  return jsonResponse(request, {
    userId,
    released,
    failed,
  })
}
