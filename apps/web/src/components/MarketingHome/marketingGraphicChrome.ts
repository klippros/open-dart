/**
 * Shared inset from the vertical center to each flank's near edge (symmetric).
 * Tight corridor by ~640px; opens to the desk flank by ~900px.
 */
export const MARKETING_GRAPHIC_CENTER_INSET =
  'clamp(2.25rem, calc(38.5vw - 13.13rem), 8.5rem)' as const

/** On-page width for the dart board graphic — fixed; spills off-screen if needed. */
export const MARKETING_GRAPHIC_WIDTH = '19.8rem' as const

/**
 * 99 Darts shell width (matches scaleX × 320px @ 16px rem).
 * Fixed size — spills off-screen on narrow viewports instead of shrinking.
 */
export const MARKETING_NINETY_NINE_WIDTH = '26rem' as const

/**
 * Absolute picker transform: center vertically in the shell, then scale.
 * Wider than tall so the column stack does not dominate the hero.
 */
export const MARKETING_NINETY_NINE_SCALE = 'translateY(-50%) scaleX(1.3) scaleY(0.52)' as const

/**
 * Layout height of the 99 shell after scaleY (picker natural height × scaleY).
 * Transform scale does not affect layout, so the shell must reserve this space.
 */
export const MARKETING_NINETY_NINE_LAYOUT_HEIGHT = '24.7rem' as const

export const MARKETING_GRAPHIC_OPACITY = 0.6

/** Board (right): shadow pulls toward center-bottom. */
export const MARKETING_BOARD_SHADOW = '-29px 21px 42px 10px rgba(0, 0, 0, 0.25)'

/** 99 Darts (left): mirrored X so the shadow still pulls toward center-bottom. */
export const MARKETING_NINETY_NINE_SHADOW = '29px 21px 42px 10px rgba(0, 0, 0, 0.25)'

interface MarketingGraphicTransform {
  rotateX: number
  rotateY: number
  rotateZ: number
  depth: number
}

const formatMarketingGraphicTransform = ({
  rotateX,
  rotateY,
  rotateZ,
  depth,
}: MarketingGraphicTransform): string =>
  `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) translateZ(${depth}px)`

/** Board (right): opens toward center. */
export const MARKETING_BOARD_TRANSFORM = formatMarketingGraphicTransform({
  rotateX: 6.4,
  rotateY: 42.2,
  rotateZ: -2.15,
  depth: 0,
})

/** 99 Darts (left): opens toward center. */
export const MARKETING_NINETY_NINE_TRANSFORM = formatMarketingGraphicTransform({
  rotateX: 8.9,
  rotateY: -59.7,
  rotateZ: 2.15,
  depth: 0,
})

/** Shared width for analysis/chart column. */
export const MARKETING_CONTENT_MAX_WIDTH = '900px'

/** Mode marquee band — 20% narrower than the analysis column. */
export const MARKETING_MODES_MAX_WIDTH = '720px'

/** Vertical rhythm between title, CTA, modes, and analysis. */
export const MARKETING_SECTION_GAP = { base: '4.375rem', md: '6.25rem' } as const
