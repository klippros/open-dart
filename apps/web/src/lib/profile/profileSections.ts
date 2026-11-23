export enum ProfileSectionId {
  X01 = 'x01',
  JdcChallenge = 'jdc-challenge',
  NinetyNineDarts = '99-darts',
  BigNumbers = 'big-numbers',
  Bob27 = 'bob27',
  OneTwentyOne = '121',
  TenUpOneDown = '10-up-1-down',
  ClaimTheBoard = 'claim-the-board',
  AroundTheClock = 'around-the-clock',
  BullRun = 'bull-run',
  Hunter = 'hunter',
}

export const OWN_PROFILE_SECTION_ORDER: readonly ProfileSectionId[] = [
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
]

/** Other players only see the core summary sections from the public payload. */
export const PUBLIC_PROFILE_SECTION_ORDER: readonly ProfileSectionId[] = [
  ProfileSectionId.X01,
  ProfileSectionId.JdcChallenge,
  ProfileSectionId.NinetyNineDarts,
  ProfileSectionId.BigNumbers,
  ProfileSectionId.Bob27,
]

const ALWAYS_VISIBLE_OWN_SECTIONS: ReadonlySet<ProfileSectionId> = new Set([
  ...PUBLIC_PROFILE_SECTION_ORDER,
  ProfileSectionId.Hunter,
])

export const getVisibleOwnProfileSections = (
  playedSections: ReadonlySet<ProfileSectionId>,
): ProfileSectionId[] =>
  OWN_PROFILE_SECTION_ORDER.filter(
    (sectionId) => ALWAYS_VISIBLE_OWN_SECTIONS.has(sectionId) || playedSections.has(sectionId),
  )
