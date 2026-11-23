export enum BigNumbersRequiredHits {
  Zero = '0',
  One = '1',
  Two = '2',
  Three = '3',
}

export interface BigNumbersConfig {
  requiredHits: BigNumbersRequiredHits
}

export interface BigNumbersPlayerState {
  /** Zero-based target index: 0 = number 1, 19 = number 20, 20 = cleared. */
  targetIndex: number
}

export interface BigNumbersState {
  config: BigNumbersConfig
  players: Record<string, BigNumbersPlayerState>
  winnerId?: string
}
