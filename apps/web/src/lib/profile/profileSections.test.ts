import { describe, expect, it } from 'vitest'
import {
  OWN_PROFILE_SECTION_ORDER,
  PUBLIC_PROFILE_SECTION_ORDER,
  ProfileSectionId,
  getVisibleOwnProfileSections,
} from './profileSections'

describe('profileSections', () => {
  it('orders core sections first and Hunter last on the own profile', () => {
    expect(OWN_PROFILE_SECTION_ORDER).toEqual([
      ProfileSectionId.X01,
      ProfileSectionId.JdcChallenge,
      ProfileSectionId.NinetyNineDarts,
      ProfileSectionId.BigNumbers,
      ProfileSectionId.Bob27,
      ProfileSectionId.OneTwentyOne,
      ProfileSectionId.TenUpOneDown,
      ProfileSectionId.ClaimTheBoard,
      ProfileSectionId.AroundTheClock,
      ProfileSectionId.BullRun,
      ProfileSectionId.Hunter,
    ])
  })

  it('keeps own-only sections off other profiles', () => {
    expect(PUBLIC_PROFILE_SECTION_ORDER).toEqual([
      ProfileSectionId.X01,
      ProfileSectionId.JdcChallenge,
      ProfileSectionId.NinetyNineDarts,
      ProfileSectionId.BigNumbers,
      ProfileSectionId.Bob27,
    ])
  })

  it('always shows core sections and Hunter, hiding unplayed extras', () => {
    expect(getVisibleOwnProfileSections(new Set())).toEqual([
      ProfileSectionId.X01,
      ProfileSectionId.JdcChallenge,
      ProfileSectionId.NinetyNineDarts,
      ProfileSectionId.BigNumbers,
      ProfileSectionId.Bob27,
      ProfileSectionId.Hunter,
    ])
  })

  it('shows played extras in stats-page order before Hunter', () => {
    expect(
      getVisibleOwnProfileSections(
        new Set([ProfileSectionId.BullRun, ProfileSectionId.OneTwentyOne]),
      ).slice(-3),
    ).toEqual([ProfileSectionId.OneTwentyOne, ProfileSectionId.BullRun, ProfileSectionId.Hunter])
  })
})
