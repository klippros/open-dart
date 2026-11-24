import { Box, Grid } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { gameMainMaxWidth, visitHistorySidebarBreakpoint } from '../layout'
import { getAroundTheClockConfig } from '@open-dart/game/aroundTheClock/aroundTheClockConfig'
import { isAroundTheClockConfig } from '@open-dart/game/game/gameConfigGuards'
import type { GameConfig, GameModeId } from '@open-dart/game/types/gameMode'
import type { Player } from '@open-dart/game/types/player'
import type { Visit } from '@open-dart/game/types/visit'
import { AroundTheClockHistoryColumn } from './Scoreboard/AroundTheClockHistoryColumn'
import { VisitHistoryColumn } from './Scoreboard/VisitHistoryColumn'

export interface GameBoardLayoutProps {
  players: Player[]
  visits: Visit[]
  mode: GameModeId
  config: GameConfig
  currentLeg?: number
  showVisitHistory: boolean
  waitingPlayerId?: string | null
  children: ReactNode
}

export const GameBoardLayout = ({
  players,
  visits,
  mode,
  config,
  currentLeg,
  showVisitHistory,
  waitingPlayerId = null,
  children,
}: GameBoardLayoutProps) => {
  const [leftPlayer, rightPlayer] = players
  const showPlayerName = players.length > 1
  const aroundTheClockConfig = isAroundTheClockConfig(mode, config)
    ? getAroundTheClockConfig(config)
    : null

  const sideHistoryDisplay = {
    base: 'none',
    [visitHistorySidebarBreakpoint]: 'block',
  } as const

  const renderHistoryColumn = (player: Player, align: 'left' | 'right') => (
    <Box
      display={sideHistoryDisplay}
      minH={0}
      minW={0}
      h="100%"
      overflowY="auto"
      className="hide-scrollbar"
    >
      {aroundTheClockConfig === null ? (
        <VisitHistoryColumn
          player={player}
          visits={visits}
          mode={mode}
          currentLeg={currentLeg}
          align={align}
          showPlayerName={showPlayerName}
          showWaitingVisit={waitingPlayerId === player.id}
        />
      ) : (
        <AroundTheClockHistoryColumn
          player={player}
          visits={visits}
          config={aroundTheClockConfig}
          currentLeg={currentLeg}
          align={align}
          showPlayerName={showPlayerName}
          showWaitingVisit={waitingPlayerId === player.id}
        />
      )}
    </Box>
  )

  return (
    <Grid
      templateColumns={{
        base: '1fr',
        [visitHistorySidebarBreakpoint]: showVisitHistory
          ? 'minmax(160px, 200px) minmax(0, 1fr) minmax(160px, 200px)'
          : '1fr',
      }}
      gap={6}
      alignItems="stretch"
      justifyContent="center"
      mx="auto"
      w="full"
      minH={0}
      h="100%"
      flex="1"
    >
      {showVisitHistory && leftPlayer !== undefined && renderHistoryColumn(leftPlayer, 'left')}

      <Box
        w="full"
        maxW={gameMainMaxWidth}
        justifySelf="center"
        minH={0}
        h="100%"
        display="flex"
        flexDirection="column"
      >
        {children}
      </Box>

      {showVisitHistory &&
        (rightPlayer === undefined ? (
          <Box display={sideHistoryDisplay} aria-hidden="true" />
        ) : (
          renderHistoryColumn(rightPlayer, 'right')
        ))}
    </Grid>
  )
}
