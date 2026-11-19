import { describe, expect, it } from 'vitest'
import { GameModeId } from '@open-dart/game/types/gameMode'
import { VisitInputMode } from '@open-dart/game/types/visit'
import { isVoiceInputSupportedForMode } from './voiceModeSupport'

describe('isVoiceInputSupportedForMode', () => {
  it('allows Bob’s 27, Around the Clock, 99 Darts, and Big Numbers', () => {
    expect(isVoiceInputSupportedForMode(GameModeId.Bob27)).toBe(true)
    expect(isVoiceInputSupportedForMode(GameModeId.AroundTheClock)).toBe(true)
    expect(isVoiceInputSupportedForMode(GameModeId.NinetyNineDarts)).toBe(true)
    expect(isVoiceInputSupportedForMode(GameModeId.BigNumbers)).toBe(true)
  })

  it('disables X01-family modes on per-dart input', () => {
    expect(isVoiceInputSupportedForMode(GameModeId.X01)).toBe(false)
    expect(isVoiceInputSupportedForMode(GameModeId.OneTwentyOne)).toBe(false)
    expect(isVoiceInputSupportedForMode(GameModeId.TenUpOneDown)).toBe(false)
    expect(
      isVoiceInputSupportedForMode(GameModeId.X01, { visitEntryMode: VisitInputMode.PerDart }),
    ).toBe(false)
  })

  it('enables X01-family modes when visit-score input is active', () => {
    expect(
      isVoiceInputSupportedForMode(GameModeId.X01, { visitEntryMode: VisitInputMode.VisitScore }),
    ).toBe(true)
    expect(
      isVoiceInputSupportedForMode(GameModeId.OneTwentyOne, {
        visitEntryMode: VisitInputMode.VisitScore,
      }),
    ).toBe(true)
    expect(
      isVoiceInputSupportedForMode(GameModeId.TenUpOneDown, {
        visitEntryMode: VisitInputMode.VisitScore,
      }),
    ).toBe(true)
  })
})
