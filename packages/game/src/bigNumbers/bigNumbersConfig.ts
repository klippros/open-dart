import { BigNumbersRequiredHits } from '../types/bigNumbers.ts'
import type { BigNumbersConfig } from '../types/bigNumbers.ts'
import { requiredHitsToNumber } from './bigNumbersRules.ts'

export const DEFAULT_BIG_NUMBERS_CONFIG: BigNumbersConfig = {
  requiredHits: BigNumbersRequiredHits.One,
}

export const getBigNumbersConfig = (config: BigNumbersConfig): BigNumbersConfig => ({
  requiredHits: config.requiredHits,
})

const REQUIRED_HITS_PARAMS: Record<BigNumbersRequiredHits, string> = {
  [BigNumbersRequiredHits.Zero]: '0',
  [BigNumbersRequiredHits.One]: '1',
  [BigNumbersRequiredHits.Two]: '2',
  [BigNumbersRequiredHits.Three]: '3',
}

const REQUIRED_HITS_LABELS: Record<BigNumbersRequiredHits, string> = {
  [BigNumbersRequiredHits.Zero]: '0 hits',
  [BigNumbersRequiredHits.One]: '1 hit',
  [BigNumbersRequiredHits.Two]: '2 hits',
  [BigNumbersRequiredHits.Three]: '3 hits',
}

export const getBigNumbersRequiredHitsLabel = (requiredHits: BigNumbersRequiredHits): string =>
  REQUIRED_HITS_LABELS[requiredHits]

export const getBigNumbersConfigLabel = (config: BigNumbersConfig): string =>
  getBigNumbersRequiredHitsLabel(getBigNumbersConfig(config).requiredHits)

/** Strict parse of a required-hits enum string; null when missing or unknown. */
export const parseBigNumbersRequiredHitsValue = (value: unknown): BigNumbersRequiredHits | null => {
  if (typeof value !== 'string') {
    return null
  }

  for (const requiredHits of Object.values(BigNumbersRequiredHits)) {
    if (REQUIRED_HITS_PARAMS[requiredHits] === value) {
      return requiredHits
    }
  }

  return null
}

export const parseBigNumbersRequiredHits = (value: string | null): BigNumbersRequiredHits =>
  parseBigNumbersRequiredHitsValue(value) ?? BigNumbersRequiredHits.One

export const buildBigNumbersGamePath = (config: BigNumbersConfig): string => {
  const normalized = getBigNumbersConfig(config)
  const params = new URLSearchParams({
    mode: 'big-numbers',
    hits: REQUIRED_HITS_PARAMS[normalized.requiredHits],
  })

  return `/game?${params.toString()}`
}

export const parseBigNumbersConfigFromSearchParams = (
  params: URLSearchParams,
): BigNumbersConfig => ({
  requiredHits: parseBigNumbersRequiredHits(params.get('hits')),
})

export const getBigNumbersRequiredHitsDescription = (
  requiredHits: BigNumbersRequiredHits,
): string => {
  if (requiredHits === BigNumbersRequiredHits.Zero) {
    return 'Every visit advances, even with no hits'
  }

  const count = requiredHitsToNumber(requiredHits)

  return `Hit ${count} large single${count === 1 ? '' : 's'} on the number to advance; miss and go back`
}
