import { Box } from '@chakra-ui/react'
import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { MarketingGraphicTransform } from '../marketingGraphicChrome'
import { MarketingTransformCubeFace } from './MarketingTransformCubeFace'

const FACE = 56
const HALF = FACE / 2
const DRAG_SENSITIVITY = 0.35

interface MarketingTransformDialProps {
  value: MarketingGraphicTransform
  onChange: (next: MarketingGraphicTransform) => void
}

/**
 * Figma-style directional dial: drag the cube to tweak rotateX / rotateY.
 * Hold Shift while dragging to adjust rotateZ instead.
 */
export const MarketingTransformDial = ({ value, onChange }: MarketingTransformDialProps) => {
  const dragRef = useRef<{
    pointerId: number
    lastX: number
    lastY: number
    shift: boolean
  } | null>(null)

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      shift: event.shiftKey,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    const dx = event.clientX - drag.lastX
    const dy = event.clientY - drag.lastY
    drag.lastX = event.clientX
    drag.lastY = event.clientY
    drag.shift = event.shiftKey

    if (drag.shift) {
      onChange({
        ...value,
        rotateZ: round1(value.rotateZ + dx * DRAG_SENSITIVITY),
      })
      return
    }

    onChange({
      ...value,
      rotateX: round1(value.rotateX - dy * DRAG_SENSITIVITY),
      rotateY: round1(value.rotateY + dx * DRAG_SENSITIVITY),
    })
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  return (
    <Box
      position="relative"
      h="160px"
      borderRadius="8px"
      bg="#2c2c2c"
      overflow="hidden"
      cursor="grab"
      userSelect="none"
      touchAction="none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ perspective: '480px' }}
      _active={{ cursor: 'grabbing' }}
      title="Drag to rotate · Shift+drag for Z"
    >
      <Box
        position="absolute"
        inset={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <Box
          position="relative"
          w={`${FACE}px`}
          h={`${FACE}px`}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${value.rotateX}deg) rotateY(${value.rotateY}deg) rotateZ(${value.rotateZ}deg)`,
          }}
        >
          <MarketingTransformCubeFace label="front" transform={`translateZ(${HALF}px)`} />
          <MarketingTransformCubeFace
            label="back"
            transform={`rotateY(180deg) translateZ(${HALF}px)`}
          />
          <MarketingTransformCubeFace
            label="right"
            transform={`rotateY(90deg) translateZ(${HALF}px)`}
          />
          <MarketingTransformCubeFace
            label="left"
            transform={`rotateY(-90deg) translateZ(${HALF}px)`}
          />
          <MarketingTransformCubeFace
            label="top"
            transform={`rotateX(90deg) translateZ(${HALF}px)`}
          />
          <MarketingTransformCubeFace
            label="bottom"
            transform={`rotateX(-90deg) translateZ(${HALF}px)`}
          />
          <Box
            position="absolute"
            top="50%"
            left="50%"
            w="8px"
            h="8px"
            ml="-4px"
            mt="-4px"
            borderRadius="full"
            bg="#0d99ff"
            style={{ transform: `translateZ(${HALF + 1}px)` }}
          />
        </Box>
      </Box>
    </Box>
  )
}

const round1 = (n: number) => Math.round(n * 10) / 10
