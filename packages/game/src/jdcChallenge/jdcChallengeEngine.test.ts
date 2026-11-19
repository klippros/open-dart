import { describe, expect, it } from 'vitest'
import { GameModeId } from '../types/gameMode'
import { PlayerKind } from '../types/player'
import {
  JdcChallengeDoubleOutcome,
  JdcChallengePart,
  JdcChallengeShanghaiOutcome,
} from '../types/jdcChallenge'
import {
  buildJdcChallengeDoubleThrow,
  buildJdcChallengeShanghaiThrow,
} from './buildJdcChallengeDarts'
import { DEFAULT_JDC_CHALLENGE_CONFIG } from './jdcChallengeConfig'
import { jdcChallengeEngine } from './jdcChallengeEngine'
import { getJdcChallengeDartTarget, JDC_CHALLENGE_VISIT_COUNT } from './jdcChallengeRules'

const player = { id: 'p1', name: 'Player 1', kind: PlayerKind.Human }

const shanghaiVisit = (target: number, outcomes: JdcChallengeShanghaiOutcome[]) =>
  outcomes.map((outcome) => buildJdcChallengeShanghaiThrow(outcome, target))

const doublesVisit = (visitIndex: number, outcomes: JdcChallengeDoubleOutcome[]) =>
  outcomes.map((outcome, dartIndex) =>
    buildJdcChallengeDoubleThrow(outcome, getJdcChallengeDartTarget(visitIndex, dartIndex)),
  )

describe('jdcChallengeEngine', () => {
  it('creates initial state with zeroed part scores', () => {
    const state = jdcChallengeEngine.createInitialState([player], DEFAULT_JDC_CHALLENGE_CONFIG)

    expect(state.players[player.id]).toEqual({
      score: 0,
      shanghaiLowScore: 0,
      doublesScore: 0,
      shanghaiHighScore: 0,
      visitsCompleted: 0,
      shanghaisHit: 0,
      doublesHit: 0,
    })
  })

  it('does not end a visit early', () => {
    const state = jdcChallengeEngine.createInitialState([player], DEFAULT_JDC_CHALLENGE_CONFIG)
    expect(
      jdcChallengeEngine.shouldEndVisitEarly(
        state,
        player.id,
        shanghaiVisit(10, [
          JdcChallengeShanghaiOutcome.Triple,
          JdcChallengeShanghaiOutcome.Miss,
          JdcChallengeShanghaiOutcome.Miss,
        ]),
      ),
    ).toBe(false)
  })

  it('scores a Shanghai visit and stays on the solo turn', () => {
    const state = jdcChallengeEngine.createInitialState([player], DEFAULT_JDC_CHALLENGE_CONFIG)
    const result = jdcChallengeEngine.commitVisit(
      state,
      player.id,
      0,
      shanghaiVisit(10, [
        JdcChallengeShanghaiOutcome.Single,
        JdcChallengeShanghaiOutcome.Double,
        JdcChallengeShanghaiOutcome.Triple,
      ]),
    )

    expect(result.visit).toMatchObject({
      visitScore: 160,
      scoreBefore: 0,
      scoreAfter: 160,
      checkout: false,
      metadata: {
        part: JdcChallengePart.ShanghaiLow,
        targetLabel: '10',
        shanghaiBonus: 100,
        isShanghai: true,
        shanghaisHit: 1,
      },
    })
    expect(result.state.players[player.id]).toMatchObject({
      score: 160,
      shanghaiLowScore: 160,
      visitsCompleted: 1,
      shanghaisHit: 1,
    })
    expect(result.advanceTurn).toBe(false)
    expect(jdcChallengeEngine.isGameComplete(result.state)).toBe(false)
  })

  it('scores a doubles visit with mixed targets', () => {
    let state = jdcChallengeEngine.createInitialState([player], DEFAULT_JDC_CHALLENGE_CONFIG)

    for (let visit = 0; visit < 6; visit += 1) {
      const target = 10 + visit
      const result = jdcChallengeEngine.commitVisit(
        state,
        player.id,
        visit,
        shanghaiVisit(target, [
          JdcChallengeShanghaiOutcome.Miss,
          JdcChallengeShanghaiOutcome.Miss,
          JdcChallengeShanghaiOutcome.Miss,
        ]),
      )
      state = result.state
    }

    const doubles = jdcChallengeEngine.commitVisit(
      state,
      player.id,
      6,
      doublesVisit(6, [
        JdcChallengeDoubleOutcome.Hit,
        JdcChallengeDoubleOutcome.Miss,
        JdcChallengeDoubleOutcome.Hit,
      ]),
    )

    expect(doubles.visit.visitScore).toBe(100)
    expect(doubles.visit.metadata).toMatchObject({
      part: JdcChallengePart.Doubles,
      targetLabel: 'D1 · D2 · D3',
      doublesHit: 2,
      doublesScore: 100,
    })
    expect(doubles.state.players[player.id]?.doublesScore).toBe(100)
  })

  it('completes after 19 visits', () => {
    let state = jdcChallengeEngine.createInitialState([player], DEFAULT_JDC_CHALLENGE_CONFIG)

    for (let visit = 0; visit < JDC_CHALLENGE_VISIT_COUNT; visit += 1) {
      const darts =
        visit < 6 || visit >= 13
          ? shanghaiVisit(visit < 6 ? 10 + visit : 15 + (visit - 13), [
              JdcChallengeShanghaiOutcome.Miss,
              JdcChallengeShanghaiOutcome.Miss,
              JdcChallengeShanghaiOutcome.Miss,
            ])
          : doublesVisit(visit, [
              JdcChallengeDoubleOutcome.Miss,
              JdcChallengeDoubleOutcome.Miss,
              JdcChallengeDoubleOutcome.Miss,
            ])

      const result = jdcChallengeEngine.commitVisit(state, player.id, visit, darts)
      state = result.state

      if (visit < JDC_CHALLENGE_VISIT_COUNT - 1) {
        expect(result.visit.checkout).toBe(false)
        expect(jdcChallengeEngine.isGameComplete(state)).toBe(false)
      } else {
        expect(result.visit.checkout).toBe(true)
        expect(state.winnerId).toBe(player.id)
        expect(state.players[player.id]?.visitsCompleted).toBe(JDC_CHALLENGE_VISIT_COUNT)
        expect(jdcChallengeEngine.isGameComplete(state)).toBe(true)
      }
    }
  })

  it('exposes scoreboard data with grade and Shanghais', () => {
    const state = jdcChallengeEngine.createInitialState([player], DEFAULT_JDC_CHALLENGE_CONFIG)
    const scored = jdcChallengeEngine.commitVisit(
      state,
      player.id,
      0,
      shanghaiVisit(10, [
        JdcChallengeShanghaiOutcome.Triple,
        JdcChallengeShanghaiOutcome.Triple,
        JdcChallengeShanghaiOutcome.Triple,
      ]),
    )
    const scoreboard = jdcChallengeEngine.getScoreboard(scored.state, [player], player.id)

    expect(scoreboard.mode).toBe(GameModeId.JdcChallenge)
    expect(scoreboard.players[0]).toMatchObject({
      primaryScore: 90,
      isActive: true,
    })
    expect(scoreboard.players[0]?.secondaryLabel).toContain('White')
    expect(scoreboard.players[0]?.secondaryLabel).toContain('0/12 SH')
    expect(scoreboard.players[0]?.secondaryLabel).toContain('11')
  })
})
