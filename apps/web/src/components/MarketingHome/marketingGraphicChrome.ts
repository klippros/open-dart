/** Fixed inset from the vertical center line to the near edge of the dart board. */
export const MARKETING_GRAPHIC_CENTER_INSET = '8.5rem'

/** 99 Darts sits closer to the center than the board. */
export const MARKETING_NINETY_NINE_CENTER_INSET = '5.25rem'

/** On-page width for the dart board graphic. */
export const MARKETING_GRAPHIC_WIDTH = {
  base: '13.2rem',
  sm: '16.5rem',
  md: '19.8rem',
} as const

/** 99 Darts width (scaleX × 320px @ 16px rem). */
export const MARKETING_NINETY_NINE_WIDTH = {
  base: '18.5rem',
  sm: '22.5rem',
  md: '26rem',
} as const

/** Wider than tall so the column stack does not dominate the hero. */
export const MARKETING_NINETY_NINE_SCALE = {
  base: 'scaleX(0.925) scaleY(0.42)',
  sm: 'scaleX(1.125) scaleY(0.48)',
  md: 'scaleX(1.3) scaleY(0.52)',
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

/** Board (right): opens toward center. */
export const MARKETING_BOARD_TRANSFORM_VALUES: MarketingGraphicTransform = {
  rotateX: 6.4,
  rotateY: 42.2,
  rotateZ: -2.15,
  depth: 0,
}

/** 99 Darts (left): opens toward center. */
export const MARKETING_NINETY_NINE_TRANSFORM_VALUES: MarketingGraphicTransform = {
  rotateX: 8.9,
  rotateY: -59.7,
  rotateZ: 2.15,
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

export const MARKETING_NINETY_NINE_TRANSFORM = formatMarketingGraphicTransform(
  MARKETING_NINETY_NINE_TRANSFORM_VALUES,
)

/** Shared width for analysis/chart column. */
export const MARKETING_CONTENT_MAX_WIDTH = '900px'

/** Mode marquee band — 20% narrower than the analysis column. */
export const MARKETING_MODES_MAX_WIDTH = '720px'

/** Vertical rhythm between title, CTA, modes, and analysis. */
export const MARKETING_SECTION_GAP = { base: '4.375rem', md: '6.25rem' } as const
