/** Inset from the vertical center line to the near edge of the dart board. */
export const MARKETING_GRAPHIC_CENTER_INSET = {
  base: '1.5rem',
  sm: '4.5rem',
  md: '8.5rem',
} as const

/** 99 Darts sits closer to the center than the board. */
export const MARKETING_NINETY_NINE_CENTER_INSET = {
  base: '0.85rem',
  sm: '3rem',
  md: '5.25rem',
} as const

/** On-page width for the dart board graphic. */
export const MARKETING_GRAPHIC_WIDTH = {
  base: '6rem',
  sm: '12rem',
  md: '19.8rem',
} as const

/**
 * 99 Darts shell width (matches scaleX × 320px @ 16px rem).
 * Keep under half the viewport on small screens so it does not spill off-edge.
 */
export const MARKETING_NINETY_NINE_WIDTH = {
  base: '7rem',
  sm: '14rem',
  md: '26rem',
} as const

/**
 * Absolute picker transform: center vertically in the shell, then scale.
 * Wider than tall so the column stack does not dominate the hero.
 */
export const MARKETING_NINETY_NINE_SCALE = {
  base: 'translateY(-50%) scaleX(0.35) scaleY(0.22)',
  sm: 'translateY(-50%) scaleX(0.7) scaleY(0.36)',
  md: 'translateY(-50%) scaleX(1.3) scaleY(0.52)',
} as const

/**
 * Layout height of the 99 shell after scaleY (picker natural height × scaleY).
 * Transform scale does not affect layout, so the shell must reserve this space.
 */
export const MARKETING_NINETY_NINE_LAYOUT_HEIGHT = {
  base: '10.3rem',
  sm: '17.1rem',
  md: '24.7rem',
} as const

/** Cap so flanks never claim more than ~36% of the viewport on phones. */
export const MARKETING_GRAPHIC_MAX_WIDTH = {
  base: 'calc(36% - 0.35rem)',
  md: 'calc(50% - 1.25rem)',
} as const

export const MARKETING_GRAPHIC_OPACITY = 0.6

/** Board (right): shadow pulls toward center-bottom. */
export const MARKETING_BOARD_SHADOW = '-29px 21px 42px 10px rgba(0, 0, 0, 0.25)'

/** 99 Darts (left): mirrored X so the shadow still pulls toward center-bottom. */
export const MARKETING_NINETY_NINE_SHADOW = '29px 21px 42px 10px rgba(0, 0, 0, 0.25)'

export interface MarketingGraphicTransform {
  rotateX: number
  rotateY: number
  rotateZ: number
  depth: number
}

/** Board (right): opens toward center. Soften Y tilt on phones so the far edge stays readable. */
export const MARKETING_BOARD_TRANSFORM_VALUES: MarketingGraphicTransform = {
  rotateX: 6.4,
  rotateY: 42.2,
  rotateZ: -2.15,
  depth: 0,
}

const MARKETING_BOARD_TRANSFORM_VALUES_MOBILE: MarketingGraphicTransform = {
  rotateX: 4.2,
  rotateY: 26,
  rotateZ: -1.4,
  depth: 0,
}

/** 99 Darts (left): opens toward center. */
export const MARKETING_NINETY_NINE_TRANSFORM_VALUES: MarketingGraphicTransform = {
  rotateX: 8.9,
  rotateY: -59.7,
  rotateZ: 2.15,
  depth: 0,
}

const MARKETING_NINETY_NINE_TRANSFORM_VALUES_MOBILE: MarketingGraphicTransform = {
  rotateX: 5.5,
  rotateY: -34,
  rotateZ: 1.4,
  depth: 0,
}

export const formatMarketingGraphicTransform = ({
  rotateX,
  rotateY,
  rotateZ,
  depth,
}: MarketingGraphicTransform): string =>
  `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) translateZ(${depth}px)`

export const MARKETING_BOARD_TRANSFORM = formatMarketingGraphicTransform(
  MARKETING_BOARD_TRANSFORM_VALUES,
)

export const MARKETING_BOARD_TRANSFORM_RESPONSIVE = {
  base: formatMarketingGraphicTransform(MARKETING_BOARD_TRANSFORM_VALUES_MOBILE),
  md: MARKETING_BOARD_TRANSFORM,
} as const

export const MARKETING_NINETY_NINE_TRANSFORM = formatMarketingGraphicTransform(
  MARKETING_NINETY_NINE_TRANSFORM_VALUES,
)

export const MARKETING_NINETY_NINE_TRANSFORM_RESPONSIVE = {
  base: formatMarketingGraphicTransform(MARKETING_NINETY_NINE_TRANSFORM_VALUES_MOBILE),
  md: MARKETING_NINETY_NINE_TRANSFORM,
} as const

/** Shared width for analysis/chart column. */
export const MARKETING_CONTENT_MAX_WIDTH = '900px'

/** Mode marquee band — 20% narrower than the analysis column. */
export const MARKETING_MODES_MAX_WIDTH = '720px'

/** Vertical rhythm between title, CTA, modes, and analysis. */
export const MARKETING_SECTION_GAP = { base: '4.375rem', md: '6.25rem' } as const
