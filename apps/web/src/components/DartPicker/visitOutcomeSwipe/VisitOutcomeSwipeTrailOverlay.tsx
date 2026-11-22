import { Box } from '@chakra-ui/react'
import { SwipeTrailGraphic } from '../SwipeTrailGraphic'
import type { VisitOutcomeSwipeTrail } from './buildVisitOutcomeSwipeTrail'

export interface VisitOutcomeSwipeTrailOverlayProps {
  trail: VisitOutcomeSwipeTrail | null
}

export const VisitOutcomeSwipeTrailOverlay = ({ trail }: VisitOutcomeSwipeTrailOverlayProps) => {
  if (trail === null || (trail.nodes.length === 0 && trail.finger === null)) {
    return null
  }

  return (
    <Box position="absolute" inset={0} pointerEvents="none" zIndex={2} aria-hidden="true">
      <svg width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
        <SwipeTrailGraphic nodes={trail.nodes} finger={trail.finger} />
      </svg>
    </Box>
  )
}
