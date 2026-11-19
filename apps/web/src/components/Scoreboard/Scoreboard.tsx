import { useMemo } from 'react'
import type { ScoreboardSnapshot } from '@open-dart/game/game/GameEngine'
import { isX01Config } from '@open-dart/game/game/gameConfigGuards'
import type { DartThrow } from '@open-dart/game/types/dart'
import type { Player } from '@open-dart/game/types/player'
import type { Visit } from '@open-dart/game/types/visit'
import { GameModeId } from '@open-dart/game/types/gameMode'
import type { GameConfig } from '@open-dart/game/types/gameMode'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { getLiveMatchDoubleCheckoutByPlayer } from '../../lib/analytics/matchPlayerStats'
import { ScoreboardCenter } from './ScoreboardCenter'
import { getLegAndMatchAverages } from './scoreboardStats'

export interface ScoreboardProps {
  mode: GameModeId
  scoreboard: ScoreboardSnapshot
  pendingDarts: DartThrow[]
  visits: Visit[]
  players: Player[]
  config: GameConfig
  matchProgress?: GameSession['matchProgress']
  hideVisitDartSlots?: boolean
}

export const Scoreboard = ({
  mode,
  scoreboard,
  pendingDarts,
  visits,
  players,
  config,
  matchProgress,
  hideVisitDartSlots = false,
}: ScoreboardProps) => {
  const legAndMatchAverages = useMemo(
    () =>
      mode === GameModeId.X01
        ? getLegAndMatchAverages(players, visits, matchProgress?.currentLeg)
        : {},
    [mode, players, visits, matchProgress?.currentLeg],
  )
  const matchCheckoutByPlayer = useMemo(() => {
    if (!isX01Config(mode, config) || matchProgress === undefined || matchProgress.legsToWin <= 1) {
      return undefined
    }

    return getLiveMatchDoubleCheckoutByPlayer(
      players,
      visits,
      { doubleIn: config.doubleIn, doubleOut: config.doubleOut },
      config.doubleIn,
    )
  }, [config, matchProgress, mode, players, visits])
  const activePlayer = scoreboard.players.find((player) => player.isActive)

  return (
    <ScoreboardCenter
      mode={mode}
      players={scoreboard.players}
      legAndMatchAverages={legAndMatchAverages}
      matchCheckoutByPlayer={matchCheckoutByPlayer}
      activePlayer={activePlayer}
      pendingDarts={pendingDarts}
      visits={visits}
      config={config}
      matchProgress={matchProgress}
      hideVisitDartSlots={hideVisitDartSlots}
    />
  )
}
