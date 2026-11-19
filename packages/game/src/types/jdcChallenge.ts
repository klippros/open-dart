export type JdcChallengeConfig = Record<string, never>

export enum JdcChallengePart {
  ShanghaiLow = 'shanghai-low',
  Doubles = 'doubles',
  ShanghaiHigh = 'shanghai-high',
}

export enum JdcChallengeTargetKind {
  Shanghai = 'shanghai',
  Double = 'double',
  Bull = 'bull',
}

export type JdcChallengeTarget =
  | { kind: JdcChallengeTargetKind.Shanghai; value: number }
  | { kind: JdcChallengeTargetKind.Double; value: number }
  | { kind: JdcChallengeTargetKind.Bull }

export enum JdcChallengeShanghaiOutcome {
  Miss = 'miss',
  Single = 'single',
  Double = 'double',
  Triple = 'triple',
}

export enum JdcChallengeDoubleOutcome {
  Miss = 'miss',
  Hit = 'hit',
}

export enum JdcChallengeGrade {
  White = 'white',
  Purple = 'purple',
  Yellow = 'yellow',
  Green = 'green',
  Blue = 'blue',
  Red = 'red',
  Black = 'black',
  Gold = 'gold',
}

export interface JdcChallengePlayerState {
  score: number
  shanghaiLowScore: number
  doublesScore: number
  shanghaiHighScore: number
  visitsCompleted: number
  shanghaisHit: number
  doublesHit: number
}

export interface JdcChallengeState {
  config: JdcChallengeConfig
  players: Record<string, JdcChallengePlayerState>
  winnerId?: string
}
