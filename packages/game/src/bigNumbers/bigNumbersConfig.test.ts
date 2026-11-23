import { describe, expect, it } from 'vitest'
import { BigNumbersRequiredHits } from '../types/bigNumbers'
import {
  buildBigNumbersGamePath,
  getBigNumbersConfigLabel,
  parseBigNumbersConfigFromSearchParams,
  parseBigNumbersRequiredHits,
} from './bigNumbersConfig'

describe('bigNumbersConfig', () => {
  it('parses required hits from search params with a default of 1', () => {
    expect(parseBigNumbersConfigFromSearchParams(new URLSearchParams('hits=2'))).toEqual({
      requiredHits: BigNumbersRequiredHits.Two,
    })
    expect(parseBigNumbersConfigFromSearchParams(new URLSearchParams('hits=0'))).toEqual({
      requiredHits: BigNumbersRequiredHits.Zero,
    })
    expect(parseBigNumbersConfigFromSearchParams(new URLSearchParams())).toEqual({
      requiredHits: BigNumbersRequiredHits.One,
    })
    expect(parseBigNumbersRequiredHits('3')).toBe(BigNumbersRequiredHits.Three)
    expect(parseBigNumbersRequiredHits('0')).toBe(BigNumbersRequiredHits.Zero)
    expect(parseBigNumbersRequiredHits('nope')).toBe(BigNumbersRequiredHits.One)
  })

  it('builds a game path with the hits param', () => {
    expect(buildBigNumbersGamePath({ requiredHits: BigNumbersRequiredHits.Two })).toBe(
      '/game?mode=big-numbers&hits=2',
    )
    expect(buildBigNumbersGamePath({ requiredHits: BigNumbersRequiredHits.Zero })).toBe(
      '/game?mode=big-numbers&hits=0',
    )
  })

  it('labels the config', () => {
    expect(getBigNumbersConfigLabel({ requiredHits: BigNumbersRequiredHits.Three })).toBe('3 hits')
    expect(getBigNumbersConfigLabel({ requiredHits: BigNumbersRequiredHits.Zero })).toBe('0 hits')
  })
})
