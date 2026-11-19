import type { GameEngine, VisitResult } from '../game/GameEngine'
import { GameModeId } from '../types/gameMode'
import type { JdcChallengeConfig, JdcChallengeState } from '../types/jdcChallenge'
import { getJdcChallengeConfig } from './jdcChallengeConfig'
import {
  getJdcChallengeGrade,
  getJdcChallengeGradeLabel,
  getJdcChallengeVisitIndex,
  getJdcChallengeVisitTargetLabel,
  JDC_CHALLENGE_MAX_DARTS_PER_VISIT,
  JDC_CHALLENGE_MAX_SHANGHAIS,
  JDC_CHALLENGE_VISIT_COUNT,
  resolveJdcChallengeVisit,
} from './jdcChallengeRules'

const getPlayerState = (state: JdcChallengeState, playerId: string) => {
  const playerState = state.players[playerId]

  if (playerState === undefined) {
    throw new Error(`Unknown player: ${playerId}`)
  }

  return playerState
}

const emptyPlayerState = () => ({
  score: 0,
  shanghaiLowScore: 0,
  doublesScore: 0,
  shanghaiHighScore: 0,
  visitsCompleted: 0,
  shanghaisHit: 0,
  doublesHit: 0,
})

export const jdcChallengeEngine: GameEngine<JdcChallengeState, JdcChallengeConfig> = {
  mode: GameModeId.JdcChallenge,
  maxDartsPerVisit: JDC_CHALLENGE_MAX_DARTS_PER_VISIT,

  createInitialState: (players, config) => ({
    config: getJdcChallengeConfig(config),
    players: Object.fromEntries(players.map((player) => [player.id, emptyPlayerState()])),
  }),

  getScoreboard: (state, players, activePlayerId) => ({
    mode: GameModeId.JdcChallenge,
    players: players.map((player) => {
      const playerState = getPlayerState(state, player.id)
      const visitIndex = getJdcChallengeVisitIndex(playerState.visitsCompleted)
      const visitsRemaining = Math.max(0, JDC_CHALLENGE_VISIT_COUNT - playerState.visitsCompleted)
      const grade = getJdcChallengeGrade(playerState.score)
      const targetLabel =
        playerState.visitsCompleted >= JDC_CHALLENGE_VISIT_COUNT
          ? 'Done'
          : getJdcChallengeVisitTargetLabel(visitIndex)

      return {
        playerId: player.id,
        name: player.name,
        primaryScore: playerState.score,
        secondaryLabel: `${getJdcChallengeGradeLabel(grade)} · ${playerState.shanghaisHit}/${JDC_CHALLENGE_MAX_SHANGHAIS} SH · ${visitsRemaining} left · ${targetLabel}`,
        isActive: player.id === activePlayerId,
      }
    }),
  }),

  applyDart: (state, playerId, pendingDarts) => {
    const playerState = getPlayerState(state, playerId)
    const outcome = resolveJdcChallengeVisit(
      playerState.score,
      playerState.shanghaiLowScore,
      playerState.doublesScore,
      playerState.shanghaiHighScore,
      playerState.visitsCompleted,
      playerState.shanghaisHit,
      playerState.doublesHit,
      pendingDarts,
    )

    return {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          score: outcome.scoreAfter,
          shanghaiLowScore: outcome.shanghaiLowScoreAfter,
          doublesScore: outcome.doublesScoreAfter,
          shanghaiHighScore: outcome.shanghaiHighScoreAfter,
          visitsCompleted: playerState.visitsCompleted,
          shanghaisHit: outcome.shanghaisHitAfter,
          doublesHit: outcome.doublesHitAfter,
        },
      },
    }
  },

  commitVisit: (state, playerId, visitIndex, darts): VisitResult<JdcChallengeState> => {
    const playerState = getPlayerState(state, playerId)
    const scoreBefore = playerState.score
    const outcome = resolveJdcChallengeVisit(
      scoreBefore,
      playerState.shanghaiLowScore,
      playerState.doublesScore,
      playerState.shanghaiHighScore,
      playerState.visitsCompleted,
      playerState.shanghaisHit,
      playerState.doublesHit,
      darts,
    )

    const visit: VisitResult<JdcChallengeState>['visit'] = {
      visitIndex,
      playerId,
      darts,
      visitScore: outcome.visitScore,
      scoreBefore,
      scoreAfter: outcome.scoreAfter,
      bust: false,
      checkout: outcome.checkout,
      metadata: {
        part: outcome.part,
        targetLabel: outcome.targetLabel,
        shanghaiBonus: outcome.shanghaiBonus,
        isShanghai: outcome.isShanghai,
        dartPoints: outcome.dartPoints,
        shanghaisHit: outcome.shanghaisHitAfter,
        doublesHit: outcome.doublesHitAfter,
        shanghaiLowScore: outcome.shanghaiLowScoreAfter,
        doublesScore: outcome.doublesScoreAfter,
        shanghaiHighScore: outcome.shanghaiHighScoreAfter,
        grade: getJdcChallengeGrade(outcome.scoreAfter),
      },
    }

    const nextState: JdcChallengeState = {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          score: outcome.scoreAfter,
          shanghaiLowScore: outcome.shanghaiLowScoreAfter,
          doublesScore: outcome.doublesScoreAfter,
          shanghaiHighScore: outcome.shanghaiHighScoreAfter,
          visitsCompleted: outcome.visitsCompletedAfter,
          shanghaisHit: outcome.shanghaisHitAfter,
          doublesHit: outcome.doublesHitAfter,
        },
      },
      winnerId: outcome.checkout ? playerId : state.winnerId,
    }

    return {
      state: nextState,
      visit,
      advanceTurn: false,
    }
  },

  shouldEndVisitEarly: () => false,

  isGameComplete: (state) => state.winnerId !== undefined,
}
