import {
  MAX_SESSION_BYTES,
  addStoredValueToBudget,
  parseProfileStatsRequest,
  parseStoredSession,
  storedValueByteLength,
} from './profileStatsGuards.ts'

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message)
  }
}

const session = {
  id: 'session-1',
  mode: 'x01',
  config: { startScore: 501, doubleIn: false, doubleOut: true },
  players: [{ id: 'user-a', name: 'A', kind: 'human' }],
  visits: [],
  status: 'completed',
  startedAt: '2026-01-01T00:00:00.000Z',
  completedAt: '2026-01-01T00:15:00.000Z',
}

Deno.test('profile stats request accepts exactly one UUID', () => {
  const userId = '00000000-0000-4000-8000-000000000001'
  assert(parseProfileStatsRequest({ userId }) === userId, 'valid UUID should pass')
  assert(parseProfileStatsRequest({ userId, extra: true }) === null, 'extra keys should fail')
  assert(parseProfileStatsRequest({ userId: 'not-a-uuid' }) === null, 'invalid UUID should fail')
  assert(parseProfileStatsRequest(null) === null, 'non-object body should fail')
})

Deno.test('stored sessions reject malformed and oversized values', () => {
  assert(parseStoredSession(session) !== null, 'valid session should parse')
  assert(parseStoredSession({ ...session, id: 42 }) === null, 'malformed session should fail')
  assert(
    parseStoredSession({ ...session, padding: 'x'.repeat(MAX_SESSION_BYTES) }) === null,
    'oversized session should fail',
  )
})

Deno.test('payload budgets count UTF-8 bytes and reject overflow', () => {
  assert(storedValueByteLength('é') === 2, 'UTF-8 byte length should be used')
  const first = addStoredValueToBudget(0, session, MAX_SESSION_BYTES)
  assert(first !== null && first > 0, 'valid session should consume budget')
  assert(
    addStoredValueToBudget(MAX_SESSION_BYTES, session, MAX_SESSION_BYTES) === null,
    'total budget overflow should fail',
  )
})

Deno.test('501 and practice reads use absolute cutoffs and errors stay generic', async () => {
  const source = await Deno.readTextFile(new URL('./index.ts', import.meta.url))
  assert(
    source.includes(".select('completed_at, result_payload, online_match_players!inner(user_id)')"),
    '501 query should join membership directly',
  )
  assert(
    source.includes(".gte('completed_at', windowStart)"),
    '501 query should have an absolute lower bound',
  )
  assert(!source.includes('latestOnlineAt'), '501 query must not anchor on latest session')
  assert(!source.includes('windowStartFromAnchor'), 'anchored window helper must be removed')
  assert(
    !source.includes('FULL_HISTORY_PRACTICE_MODES'),
    'full-history practice modes must be removed',
  )
  assert(!source.includes('AroundTheClock'), 'Around the Clock must not be a public practice mode')
  assert(!source.includes('Hunter'), 'Hunter must not be a public practice mode')
  assert(!source.includes(".in('id', matchIds)"), '501 query must not fetch an unbounded id list')
  assert(
    source.includes(".eq('mode', GameModeId.X01)"),
    'local x01 should be read from game_sessions',
  )
  assert(source.includes('startScore: 501'), 'public x01 query should stay on 501')
  assert(!source.includes('error.message'), 'database errors must not be reflected')
})
