import { Box } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { DartMultiplier } from '@open-dart/game/types/dart'
import { DartBoardGraphic } from '../DartPicker/DartBoardGraphic'
import {
  DARTBOARD_CENTER,
  DARTBOARD_INNER_RADIUS,
  DARTBOARD_NUMBERS,
  DARTBOARD_OUTER_RADIUS,
  DARTBOARD_VIEWBOX_SIZE,
  getSegmentAngles,
  polarToCartesian,
  toBoardWorldPoint,
} from '../DartPicker/dartboardLayout'
import type { CenterZone } from '../DartPicker/dartboardLayout'
import { SwipeTrailGraphic } from '../DartPicker/SwipeTrailGraphic'
import type { SwipeTrailPoint } from '../DartPicker/visitOutcomeSwipe/buildVisitOutcomeSwipeTrail'
import {
  MARKETING_BOARD_SHADOW,
  MARKETING_BOARD_TRANSFORM,
  MARKETING_GRAPHIC_CENTER_INSET,
  MARKETING_GRAPHIC_OPACITY,
  MARKETING_GRAPHIC_WIDTH,
} from './marketingGraphicChrome'

const noop = () => undefined

const CENTER_POINTS: Record<CenterZone, SwipeTrailPoint> = {
  double: { x: DARTBOARD_CENTER - 40, y: DARTBOARD_CENTER },
  triple: { x: DARTBOARD_CENTER + 40, y: DARTBOARD_CENTER },
}

const RING_MID_RADIUS = (DARTBOARD_INNER_RADIUS + DARTBOARD_OUTER_RADIUS) / 2

const numberPoint = (number: number): SwipeTrailPoint => {
  const index = Math.max(
    0,
    DARTBOARD_NUMBERS.findIndex((entry) => entry === number),
  )
  const { mid } = getSegmentAngles(index)
  const local = polarToCartesian(DARTBOARD_CENTER, DARTBOARD_CENTER, RING_MID_RADIUS, mid)
  return toBoardWorldPoint(local.x, local.y)
}

const zoneMultiplier = (zone: CenterZone): DartMultiplier.Double | DartMultiplier.Triple =>
  zone === 'double' ? DartMultiplier.Double : DartMultiplier.Triple

/** Demo center-drag paths (same gesture as in-game double/treble → number). */
const DRAG_DEMOS = [
  { zone: 'triple' as const, number: 20 },
  { zone: 'triple' as const, number: 19 },
  { zone: 'double' as const, number: 12 },
] as const

const DRAG_MS = 750
const HOLD_MS = 260
const GAP_MS = 360
const SEGMENT_MS = DRAG_MS + HOLD_MS + GAP_MS

interface BoardDemoState {
  activeMultiplier: DartMultiplier.Double | DartMultiplier.Triple | null
  activeCenterZone: CenterZone | null
  hoveredNumber: number | null
  trailStart: SwipeTrailPoint | null
  finger: SwipeTrailPoint | null
}

const IDLE_DEMO: BoardDemoState = {
  activeMultiplier: null,
  activeCenterZone: null,
  hoveredNumber: null,
  trailStart: null,
  finger: null,
}

const lerp = (from: SwipeTrailPoint, to: SwipeTrailPoint, t: number): SwipeTrailPoint => ({
  x: from.x + (to.x - from.x) * t,
  y: from.y + (to.y - from.y) * t,
})

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/**
 * Same board chrome + DartBoardGraphic as in-game DartPicker.
 * Auto-plays center-drag (double/treble → number) with swipe trail.
 */
export const MarketingDartBoardGraphic = () => {
  const [demo, setDemo] = useState<BoardDemoState>(IDLE_DEMO)

  useEffect(() => {
    let frame = 0
    let start: number | null = null

    const tick = (now: number) => {
      start ??= now
      const elapsed = (now - start) % (SEGMENT_MS * DRAG_DEMOS.length)
      const demoIndex = Math.floor(elapsed / SEGMENT_MS) % DRAG_DEMOS.length
      const local = elapsed - demoIndex * SEGMENT_MS
      const drag = DRAG_DEMOS[demoIndex] ?? DRAG_DEMOS[0]
      const from = CENTER_POINTS[drag.zone]
      const to = numberPoint(drag.number)

      if (local < DRAG_MS) {
        const t = easeInOut(local / DRAG_MS)
        setDemo({
          activeMultiplier: zoneMultiplier(drag.zone),
          activeCenterZone: drag.zone,
          hoveredNumber: t > 0.42 ? drag.number : null,
          trailStart: from,
          finger: lerp(from, to, t),
        })
      } else if (local < DRAG_MS + HOLD_MS) {
        setDemo({
          activeMultiplier: zoneMultiplier(drag.zone),
          activeCenterZone: drag.zone,
          hoveredNumber: drag.number,
          trailStart: from,
          finger: to,
        })
      } else {
        setDemo(IDLE_DEMO)
      }

      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      ml={MARKETING_GRAPHIC_CENTER_INSET}
      transform="translateY(-50%)"
      w={MARKETING_GRAPHIC_WIDTH}
      pointerEvents="none"
      aria-hidden="true"
      zIndex={0}
      style={{ perspective: '1200px' }}
    >
      <Box transformOrigin="center center" transform="scale(1.012)">
        <Box
          opacity={MARKETING_GRAPHIC_OPACITY}
          transform={MARKETING_BOARD_TRANSFORM}
          transformOrigin="left center"
          transformStyle="preserve-3d"
          boxShadow={MARKETING_BOARD_SHADOW}
          borderRadius="8px"
        >
          <Box
            w="100%"
            borderRadius="8px"
            overflow="hidden"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            userSelect="none"
          >
            <svg
              viewBox={`0 0 ${DARTBOARD_VIEWBOX_SIZE} ${DARTBOARD_VIEWBOX_SIZE}`}
              width="100%"
              display="block"
            >
              <DartBoardGraphic
                hoveredNumber={demo.hoveredNumber}
                hoveredCorner={null}
                hoveredCenterZone={null}
                activeCenterZone={demo.activeCenterZone}
                activeMultiplier={demo.activeMultiplier}
                inputDisabled
                onCornerClick={noop}
                onNumberClick={noop}
                onCenterPointerDown={noop}
                onCornerHover={noop}
                onNumberHover={noop}
                onCenterHover={noop}
              />
              {demo.trailStart === null ? null : (
                <SwipeTrailGraphic nodes={[demo.trailStart]} finger={demo.finger} />
              )}
            </svg>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
