import { Box } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { buildNinetyNineDartsThrow } from '@open-dart/game/ninetyNineDarts/buildNinetyNineDarts'
import {
  NINETY_NINE_DARTS_MAX_DARTS_PER_VISIT,
  getNinetyNineDartsPickerOutcomes,
} from '@open-dart/game/ninetyNineDarts/ninetyNineDartsRules'
import {
  NinetyNineDartsOutcome,
  NinetyNineDartsTargetKind,
} from '@open-dart/game/types/ninetyNineDarts'
import type { DartThrow } from '@open-dart/game/types/dart'
import { NinetyNineDartsDartPicker } from '../DartPicker/NinetyNineDartsDartPicker/NinetyNineDartsDartPicker'
import { SwipeTrailGraphic } from '../DartPicker/SwipeTrailGraphic'
import {
  formatMarketingGraphicTransform,
  MARKETING_GRAPHIC_OPACITY,
  MARKETING_NINETY_NINE_CENTER_INSET,
  MARKETING_NINETY_NINE_SCALE,
  MARKETING_NINETY_NINE_SHADOW,
  MARKETING_NINETY_NINE_TRANSFORM,
  MARKETING_NINETY_NINE_WIDTH,
} from './marketingGraphicChrome'
import { useMarketingGraphicTransformOptional } from './marketingGraphicTransformContext'

const noopDartBatch = (_darts: DartThrow[]) => undefined
const noopUndo = () => undefined

const DEMO_TARGET = { kind: NinetyNineDartsTargetKind.Number, value: 20 } as const

/** One committed outcome per dart column for the looping demo swipe. */
const DEMO_OUTCOMES = [
  NinetyNineDartsOutcome.Triple,
  NinetyNineDartsOutcome.Single,
  NinetyNineDartsOutcome.Double,
] as const

const PICKER_WIDTH = 320
/** Matches Chakra gap={3} on the picker grid. */
const COLUMN_GAP = 12
const COLUMN_WIDTH =
  (PICKER_WIDTH - COLUMN_GAP * (NINETY_NINE_DARTS_MAX_DARTS_PER_VISIT - 1)) /
  NINETY_NINE_DARTS_MAX_DARTS_PER_VISIT

/** Display order is reverse of picker outcomes (treble/double at top). */
const displayOutcomes = [...getNinetyNineDartsPickerOutcomes(DEMO_TARGET)].reverse()

const CARD_GAP = 8
const CARD_HEIGHTS: Record<NinetyNineDartsOutcome, number> = {
  [NinetyNineDartsOutcome.Triple]: 208,
  [NinetyNineDartsOutcome.Double]: 104,
  [NinetyNineDartsOutcome.Single]: 208,
  [NinetyNineDartsOutcome.Miss]: 208,
}

const columnCenterX = (column: number) => column * (COLUMN_WIDTH + COLUMN_GAP) + COLUMN_WIDTH / 2

const outcomeCenterY = (outcome: NinetyNineDartsOutcome) => {
  let y = 0
  for (const entry of displayOutcomes) {
    const height = CARD_HEIGHTS[entry] ?? 208
    if (entry === outcome) {
      return y + height / 2
    }
    y += height + CARD_GAP
  }
  return y
}

const DEMO_HEIGHT =
  displayOutcomes.reduce((sum, outcome, index) => {
    const height = CARD_HEIGHTS[outcome] ?? 208
    return sum + height + (index > 0 ? CARD_GAP : 0)
  }, 0) + 8

const PATH_POINTS = DEMO_OUTCOMES.map((outcome, column) => ({
  x: columnCenterX(column),
  y: outcomeCenterY(outcome),
}))

const SEGMENT_COUNT = NINETY_NINE_DARTS_MAX_DARTS_PER_VISIT - 1

/**
 * Exact 99 Darts picker with a looping background swipe.
 * Card commits land when the finger reaches each column (same phase as the trail).
 */
export const MarketingNinetyNineGraphic = () => {
  const [progress, setProgress] = useState(0)
  const live = useMarketingGraphicTransformOptional()
  const transform = live
    ? formatMarketingGraphicTransform(live.ninetyNine)
    : MARKETING_NINETY_NINE_TRANSFORM

  useEffect(() => {
    let frame = 0
    let start: number | null = null
    const speed = 1.3
    const leadInMs = 550 / speed
    const swipeMs = 2100 / speed
    const holdMs = 1500 / speed
    const cycleMs = leadInMs + swipeMs + holdMs

    const tick = (now: number) => {
      start ??= now
      const elapsed = (now - start) % cycleMs
      if (elapsed < leadInMs) {
        // Finger rests on dart 1 with nothing selected yet.
        setProgress(0)
      } else if (elapsed < leadInMs + swipeMs) {
        setProgress((elapsed - leadInMs) / swipeMs)
      } else {
        setProgress(1)
      }
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [])

  // Finger travels column 0 → 1 → 2 as progress 0 → 1 across SEGMENT_COUNT steps.
  // Commit column i when the finger reaches it (start of segment i, or end for last).
  const reachedColumn =
    progress <= 0
      ? -1
      : progress >= 1
        ? NINETY_NINE_DARTS_MAX_DARTS_PER_VISIT - 1
        : Math.min(
            NINETY_NINE_DARTS_MAX_DARTS_PER_VISIT - 1,
            Math.floor(progress * SEGMENT_COUNT + 0.0001),
          )

  const committedCount = reachedColumn + 1

  const pendingDarts = DEMO_OUTCOMES.slice(0, Math.max(0, committedCount)).map((outcome) =>
    buildNinetyNineDartsThrow(outcome, DEMO_TARGET),
  )

  const segment = progress * SEGMENT_COUNT
  const fromIndex = Math.min(SEGMENT_COUNT - 1, Math.floor(segment))
  const localT = segment - fromIndex
  const startPoint = PATH_POINTS[0]
  const from = PATH_POINTS[fromIndex] ?? startPoint
  const to = PATH_POINTS[Math.min(PATH_POINTS.length - 1, fromIndex + 1)] ?? from
  const finger =
    progress >= 1 || startPoint === undefined || from === undefined || to === undefined
      ? null
      : progress <= 0
        ? startPoint
        : {
            x: from.x + (to.x - from.x) * Math.min(1, Math.max(0, localT)),
            y: from.y + (to.y - from.y) * Math.min(1, Math.max(0, localT)),
          }

  const nodes =
    committedCount <= 0 ? [] : PATH_POINTS.slice(0, Math.min(PATH_POINTS.length, committedCount))

  return (
    <Box
      position="absolute"
      top="72%"
      left="50%"
      marginLeft={`calc(-1 * ${MARKETING_NINETY_NINE_CENTER_INSET})`}
      transform="translate(-100%, -50%)"
      w={MARKETING_NINETY_NINE_WIDTH}
      maxW="calc(50% - 1.25rem)"
      pointerEvents="none"
      aria-hidden="true"
      zIndex={0}
      style={{ perspective: '1200px' }}
    >
      <Box
        w={`${PICKER_WIDTH}px`}
        ml="auto"
        transform={MARKETING_NINETY_NINE_SCALE}
        transformOrigin="right center"
      >
        <Box
          opacity={MARKETING_GRAPHIC_OPACITY}
          transform={transform}
          transformOrigin="center center"
          transformStyle="preserve-3d"
          boxShadow={MARKETING_NINETY_NINE_SHADOW}
          borderRadius="14px"
          position="relative"
        >
          <Box w={`${PICKER_WIDTH}px`} minW={`${PICKER_WIDTH}px`} maxW={`${PICKER_WIDTH}px`}>
            <NinetyNineDartsDartPicker
              target={DEMO_TARGET}
              pendingDarts={pendingDarts}
              onDarts={noopDartBatch}
              onUndo={noopUndo}
              hideUndo
            />
          </Box>
          <Box
            position="absolute"
            top={0}
            left={0}
            w={`${PICKER_WIDTH}px`}
            h={`${DEMO_HEIGHT}px`}
            pointerEvents="none"
          >
            <svg width={PICKER_WIDTH} height={DEMO_HEIGHT}>
              <SwipeTrailGraphic nodes={nodes} finger={finger} />
            </svg>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
