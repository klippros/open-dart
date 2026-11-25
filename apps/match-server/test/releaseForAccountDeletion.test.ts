import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { MatchObject } from '../src/match/MatchObject'
import { MatchCommandName, MatchEndingKind, MatchStatus } from '../src/match/types'
import { createMatchId, creatorUserId, initWaitingMatch, otherUserId } from './helpers'

const inviteTokenOf = async (stub: DurableObjectStub<MatchObject>): Promise<string> => {
  const state = await stub.applyCommand(creatorUserId, { name: MatchCommandName.GetState })
  const token = state.state?.inviteToken

  if (token === undefined) {
    throw new Error('Match has no invite token')
  }

  return token
}

const startActiveMatch = async () => {
  const stub = await initWaitingMatch()
  const joined = await stub.join({
    userId: otherUserId,
    inviteToken: await inviteTokenOf(stub),
  })

  if (!joined.ok) {
    throw new Error(joined.message ?? 'Failed to join match')
  }

  const began = await stub.applyCommand(creatorUserId, { name: MatchCommandName.BeginMatch })
  if (!began.ok) {
    throw new Error(began.message ?? 'Failed to begin match')
  }

  return stub
}

describe('releaseForAccountDeletion', () => {
  it('cancels a waiting lobby the user created', async () => {
    const stub = await initWaitingMatch()
    await stub.join({
      userId: otherUserId,
      inviteToken: await inviteTokenOf(stub),
    })

    const released = await stub.releaseForAccountDeletion(creatorUserId)

    expect(released.ok).toBe(true)
    expect(released.state?.status).toBe(MatchStatus.Cancelled)
    expect(released.state?.endingKind).toBe(MatchEndingKind.CreatorCancel)
  })

  it('leaves a waiting lobby the user joined without closing it', async () => {
    const stub = await initWaitingMatch()
    await stub.join({
      userId: otherUserId,
      inviteToken: await inviteTokenOf(stub),
    })

    const released = await stub.releaseForAccountDeletion(otherUserId)

    expect(released.ok).toBe(true)
    expect(released.state?.status).toBe(MatchStatus.Waiting)
    expect(released.state?.players.map((player) => player.userId)).toEqual([creatorUserId])
  })

  it('abandons an active match so the opponent wins', async () => {
    const stub = await startActiveMatch()
    const released = await stub.releaseForAccountDeletion(creatorUserId)

    expect(released.ok).toBe(true)
    expect(released.state?.status).toBe(MatchStatus.Completed)
    expect(released.state?.endingKind).toBe(MatchEndingKind.Abandon)
    expect(released.state?.winnerUserId).toBe(otherUserId)
  })

  it('rejects the admin HTTP route without the service role key', async () => {
    const response = await exports.default.fetch(
      `https://match.example/v1/admin/users/${creatorUserId}/release-matches`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer wrong-key' },
      },
    )

    expect(response.status).toBe(401)
  })

  it('accepts the admin HTTP route with the service role key', async () => {
    const response = await exports.default.fetch(
      `https://match.example/v1/admin/users/${createMatchId()}/release-matches`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer test-service-role-key' },
      },
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      released: [],
      failed: [],
    })
  })
})
