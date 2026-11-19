import { gameModeDefinitions } from '@open-dart/game/game/gameModeDefinitions.ts'
import {
  isAroundTheClockConfig,
  isBigNumbersConfig,
  isBullRunConfig,
  isClaimTheBoardConfig,
  isNinetyNineDartsConfig,
  isX01Config,
} from '@open-dart/game/game/gameConfigGuards.ts'
import { getBigNumbersConfigLabel } from '@open-dart/game/bigNumbers/bigNumbersConfig.ts'
import { getBullRunConfigLabel } from '@open-dart/game/bullRun/bullRunConfig.ts'
import {
  getAroundTheClockAimModeLabel,
  getAroundTheClockConfig,
} from '@open-dart/game/aroundTheClock/aroundTheClockConfig.ts'
import { getNinetyNineDartsConfigLabel } from '@open-dart/game/ninetyNineDarts/ninetyNineDartsConfig.ts'
import { formatX01StartScore } from '@open-dart/game/x01/x01Presets.ts'
import type { GameSession } from '@open-dart/game/types/gameSession.ts'

export const getSessionCompletedAt = (session: GameSession): string =>
  session.completedAt ?? session.startedAt

export const getSessionModeLabel = (session: GameSession): string => {
  if (isX01Config(session.mode, session.config)) {
    return formatX01StartScore(session.config)
  }

  if (isAroundTheClockConfig(session.mode, session.config)) {
    const { aimMode } = getAroundTheClockConfig(session.config)

    return `${gameModeDefinitions[session.mode].label} · ${getAroundTheClockAimModeLabel(aimMode)}`
  }

  if (isClaimTheBoardConfig(session.mode, session.config)) {
    return `${gameModeDefinitions[session.mode].label} · ${getAroundTheClockAimModeLabel(session.config.aimMode)}`
  }

  if (isNinetyNineDartsConfig(session.mode, session.config)) {
    return `${gameModeDefinitions[session.mode].label} · ${getNinetyNineDartsConfigLabel(session.config)}`
  }

  if (isBullRunConfig(session.mode, session.config)) {
    return `${gameModeDefinitions[session.mode].label} · ${getBullRunConfigLabel(session.config)}`
  }

  if (isBigNumbersConfig(session.mode, session.config)) {
    return `${gameModeDefinitions[session.mode].label} · ${getBigNumbersConfigLabel(session.config)}`
  }

  return gameModeDefinitions[session.mode].label
}
