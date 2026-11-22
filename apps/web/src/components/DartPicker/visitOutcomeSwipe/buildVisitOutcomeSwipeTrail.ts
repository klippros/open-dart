import type { VisitOutcomeFieldCenter } from './visitOutcomeSwipe'

export interface SwipeTrailPoint {
  x: number
  y: number
}

export interface VisitOutcomeSwipeTrail {
  nodes: SwipeTrailPoint[]
  finger: SwipeTrailPoint | null
}

/**
 * Map resolved preview outcomes to locked trail nodes (field centers), then
 * attach the live finger tip. Coordinates are converted from client space into
 * the overlay's local space via `origin`.
 */
export const buildVisitOutcomeSwipeTrail = <TOutcome extends string>({
  previewOutcomes,
  pendingCount,
  centers,
  finger,
  origin,
}: {
  previewOutcomes: readonly TOutcome[]
  pendingCount: number
  centers: readonly VisitOutcomeFieldCenter<TOutcome>[]
  finger: SwipeTrailPoint | null
  origin: SwipeTrailPoint
}): VisitOutcomeSwipeTrail => {
  const nodes: SwipeTrailPoint[] = []

  for (let index = 0; index < previewOutcomes.length; index += 1) {
    const outcome = previewOutcomes[index]
    const column = pendingCount + index

    if (outcome === undefined) {
      continue
    }

    const center = centers.find((entry) => entry.column === column && entry.outcome === outcome)

    if (center === undefined) {
      continue
    }

    nodes.push({
      x: center.x - origin.x,
      y: center.y - origin.y,
    })
  }

  return {
    nodes,
    finger:
      finger === null
        ? null
        : {
            x: finger.x - origin.x,
            y: finger.y - origin.y,
          },
  }
}
