import type { GameEngine, VisitResult } from '../game/GameEngine'
import { GameModeId } from '../types/gameMode'
import type { BigNumbersConfig, BigNumbersState } from '../types/bigNumbers'
import { getBigNumbersConfig } from './bigNumbersConfig'
import {
  BIG_NUMBERS_TARGET_COUNT,
  getBigNumbersTargetLabel,
  getBigNumbersTargetNumber,
  resolveBigNumbersVisit,
} from './bigNumbersRules'

const getPlayerState = (state: BigNumbersState, playerId: string) => {
  const playerState = state.players[playerId]

  if (playerState === undefined) {
    throw new Error(`Unknown player: ${playerId}`)
  }

  return playerState
}

export const bigNumbersEngine: GameEngine<BigNumbersState, BigNumbersConfig> = {
  mode: GameModeId.BigNumbers,
  maxDartsPerVisit: 3,

  createInitialState: (players, config) => ({
    config,
    players: Object.fromEntries(players.map((player) => [player.id, { targetIndex: 0 }])),
  }),

  getScoreboard: (state, players, activePlayerId) => ({
    mode: GameModeId.BigNumbers,
    players: players.map((player) => {
      const playerState = getPlayerState(state, player.id)
      const progress =
        playerState.targetIndex >= BIG_NUMBERS_TARGET_COUNT
          ? BIG_NUMBERS_TARGET_COUNT
          : getBigNumbersTargetNumber(playerState.targetIndex)

      return {
        playerId: player.id,
        name: player.name,
        primaryScore: progress,
        primaryDisplay: `${progress}/${BIG_NUMBERS_TARGET_COUNT}`,
        isActive: player.id === activePlayerId,
      }
    }),
  }),

  applyDart: (state, playerId, pendingDarts) => {
    const playerState = getPlayerState(state, playerId)
    const { requiredHits } = getBigNumbersConfig(state.config)
    const outcome = resolveBigNumbersVisit(playerState.targetIndex, pendingDarts, requiredHits)

    return {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          targetIndex: outcome.targetIndexAfter,
        },
      },
    }
  },

  commitVisit: (state, playerId, visitIndex, darts): VisitResult<BigNumbersState> => {
    const playerState = getPlayerState(state, playerId)
    const { requiredHits } = getBigNumbersConfig(state.config)
    const scoreBefore = getBigNumbersTargetNumber(playerState.targetIndex)
    const outcome = resolveBigNumbersVisit(playerState.targetIndex, darts, requiredHits)
    const scoreAfter =
      outcome.targetIndexAfter >= 20 ? 21 : getBigNumbersTargetNumber(outcome.targetIndexAfter)

    const visit: VisitResult<BigNumbersState>['visit'] = {
      visitIndex,
      playerId,
      darts,
      visitScore: outcome.hitCount,
      scoreBefore,
      scoreAfter,
      bust: false,
      checkout: outcome.checkout,
      metadata: {
        targetLabel: getBigNumbersTargetLabel(playerState.targetIndex),
        hitCount: outcome.hitCount,
        advanced: outcome.advanced,
      },
    }

    const nextState: BigNumbersState = {
      ...state,
      players: {
        ...state.players,
        [playerId]: {
          targetIndex: outcome.targetIndexAfter,
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
