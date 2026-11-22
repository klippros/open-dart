import type { SwipeTrailPoint } from './visitOutcomeSwipe/buildVisitOutcomeSwipeTrail'

/** Bright green trail that reads on the dark scoring UI without copying Android's palette. */
export const SWIPE_TRAIL_COLOR = '#9BE15D'
const SWIPE_TRAIL_STROKE_WIDTH = 5
const SWIPE_TRAIL_NODE_RADIUS = 12
const SWIPE_TRAIL_NODE_RING = 3
const SWIPE_TRAIL_FINGER_RADIUS = 7

export interface SwipeTrailGraphicProps {
  nodes: readonly SwipeTrailPoint[]
  finger: SwipeTrailPoint | null
}

const buildPolylinePoints = (
  nodes: readonly SwipeTrailPoint[],
  finger: SwipeTrailPoint | null,
): string => {
  const points = finger === null ? nodes : [...nodes, finger]
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

/** Shared path + node markers for visit-grid overlays and the dartboard SVG. */
export const SwipeTrailGraphic = ({ nodes, finger }: SwipeTrailGraphicProps) => {
  if (nodes.length === 0 && finger === null) {
    return null
  }

  const polyline = buildPolylinePoints(nodes, finger)

  return (
    <g pointerEvents="none" aria-hidden="true">
      {polyline.length > 0 ? (
        <polyline
          points={polyline}
          fill="none"
          stroke={SWIPE_TRAIL_COLOR}
          strokeWidth={SWIPE_TRAIL_STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      ) : null}
      {nodes.map((node) => (
        <g key={`${node.x.toFixed(2)},${node.y.toFixed(2)}`}>
          <circle
            cx={node.x}
            cy={node.y}
            r={SWIPE_TRAIL_NODE_RADIUS}
            fill="none"
            stroke={SWIPE_TRAIL_COLOR}
            strokeWidth={SWIPE_TRAIL_NODE_RING}
            opacity={0.95}
          />
          <circle cx={node.x} cy={node.y} r={4} fill={SWIPE_TRAIL_COLOR} />
        </g>
      ))}
      {finger === null ? null : (
        <circle
          cx={finger.x}
          cy={finger.y}
          r={SWIPE_TRAIL_FINGER_RADIUS}
          fill={SWIPE_TRAIL_COLOR}
          opacity={0.95}
        />
      )}
    </g>
  )
}
