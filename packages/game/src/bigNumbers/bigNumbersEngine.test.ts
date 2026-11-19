import { describe, expect, it } from 'vitest'
import { GameModeId } from '../types/gameMode'
import { BigNumbersRequiredHits } from '../types/bigNumbers'
import { PlayerKind } from '../types/player'
import { bigNumbersEngine } from './bigNumbersEngine'
import { buildBigNumbersDartsForHitCount } from './buildBigNumbersDarts'

const player = { id: 'p1', name: 'Player 1', kind: PlayerKind.Human }
const config = { requiredHits: BigNumbersRequiredHits.Two }

describe('bigNumbersEngine', () => {
  it('creates initial state on number 1', () => {
    const state = bigNumbersEngine.createInitialState([player], config)

    expect(state.players[player.id]).toEqual({ targetIndex: 0 })
  })

  it('commits an advance when the hit count meets the requirement', () => {
    const state = bigNumbersEngine.createInitialState([player], config)
    const result = bigNumbersEngine.commitVisit(
      state,
      player.id,
      0,
      buildBigNumbersDartsForHitCount(2, 0),
    )

    expect(result.visit).toMatchObject({
      visitScore: 2,
      scoreBefore: 1,
      scoreAfter: 2,
      checkout: false,
      metadata: { targetLabel: '1', hitCount: 2, advanced: true },
    })
    expect(result.state.players[player.id]).toEqual({ targetIndex: 1 })
    expect(result.advanceTurn).toBe(false)
  })

  it('goes back on a short visit and stays on 1', () => {
    const started = bigNumbersEngine.createInitialState([player], config)
    const onTwo = bigNumbersEngine.commitVisit(
      started,
      player.id,
      0,
      buildBigNumbersDartsForHitCount(2, 0),
    ).state

    const retreat = bigNumbersEngine.commitVisit(
      onTwo,
      player.id,
      1,
      buildBigNumbersDartsForHitCount(1, 1),
    )

    expect(retreat.visit).toMatchObject({
      scoreBefore: 2,
      scoreAfter: 1,
      metadata: { advanced: false, hitCount: 1 },
    })
    expect(retreat.state.players[player.id]).toEqual({ targetIndex: 0 })

    const stay = bigNumbersEngine.commitVisit(
      retreat.state,
      player.id,
      2,
      buildBigNumbersDartsForHitCount(0, 0),
    )

    expect(stay.visit).toMatchObject({
      scoreBefore: 1,
      scoreAfter: 1,
      metadata: { advanced: false, hitCount: 0 },
    })
    expect(stay.state.players[player.id]).toEqual({ targetIndex: 0 })
  })

  it('finishes when advancing from 20', () => {
    let state = bigNumbersEngine.createInitialState([player], {
      requiredHits: BigNumbersRequiredHits.One,
    })

    for (let visitIndex = 0; visitIndex < 19; visitIndex += 1) {
      state = bigNumbersEngine.commitVisit(
        state,
        player.id,
        visitIndex,
        buildBigNumbersDartsForHitCount(1, visitIndex),
      ).state
    }

    expect(state.players[player.id]?.targetIndex).toBe(19)

    const finish = bigNumbersEngine.commitVisit(
      state,
      player.id,
      19,
      buildBigNumbersDartsForHitCount(1, 19),
    )

    expect(finish.visit).toMatchObject({
      scoreBefore: 20,
      scoreAfter: 21,
      checkout: true,
      metadata: { targetLabel: '20', advanced: true },
    })
    expect(finish.state.winnerId).toBe(player.id)
    expect(bigNumbersEngine.isGameComplete(finish.state)).toBe(true)
  })

  it('exposes progress as current number over 20 on the scoreboard', () => {
    const state = bigNumbersEngine.createInitialState([player], config)
    const scoreboard = bigNumbersEngine.getScoreboard(state, [player], player.id)

    expect(scoreboard.mode).toBe(GameModeId.BigNumbers)
    expect(scoreboard.players[0]).toMatchObject({
      primaryScore: 1,
      primaryDisplay: '1/20',
      isActive: true,
    })
  })

  it('does not end a visit early', () => {
    const state = bigNumbersEngine.createInitialState([player], config)

    expect(
      bigNumbersEngine.shouldEndVisitEarly(state, player.id, buildBigNumbersDartsForHitCount(3, 0)),
    ).toBe(false)
  })
})
