export const mainContentMaxWidth = '1200px' as const

/** Width of the in-game scoreboard and dart picker column. */
export const gameMainMaxWidth = '720px' as const

/**
 * Side visit-history columns appear at this breakpoint.
 * Below it, use the stacked history under the scoreboard instead.
 */
export const visitHistorySidebarBreakpoint = 'lg' as const

/** Shared size for toolbar icon buttons and matching controls. */
export const toolbarControlSize = '44px' as const

/**
 * Line box of the profile name (Chakra heading size 2xl).
 * The JDC jersey uses the same height so it lines up with the name.
 */
export const profileNameHeight = '2rem' as const

/** Taller than default Chakra Button md (h="10") for easier tap targets. */
export const scoreInputButtonHeight = '20' as const
