import { GameModeId } from '../types/gameMode.ts'
import type { JdcChallengeConfig } from '../types/jdcChallenge.ts'

export const DEFAULT_JDC_CHALLENGE_CONFIG: JdcChallengeConfig = {}

export const getJdcChallengeConfig = (
  config: JdcChallengeConfig = DEFAULT_JDC_CHALLENGE_CONFIG,
): JdcChallengeConfig => ({ ...config })

export const buildJdcChallengeGamePath = (): string => `/game?mode=${GameModeId.JdcChallenge}`
