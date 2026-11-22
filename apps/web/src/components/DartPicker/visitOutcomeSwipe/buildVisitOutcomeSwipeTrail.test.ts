import { describe, expect, it } from 'vitest'
import { buildVisitOutcomeSwipeTrail } from './buildVisitOutcomeSwipeTrail'
import type { VisitOutcomeFieldCenter } from './visitOutcomeSwipe'

type Outcome = 'miss' | 'single' | 'double'

const centers = (entries: VisitOutcomeFieldCenter<Outcome>[]): VisitOutcomeFieldCenter<Outcome>[] =>
  entries

describe('buildVisitOutcomeSwipeTrail', () => {
  it('maps preview outcomes to local node centers and the finger tip', () => {
    const trail = buildVisitOutcomeSwipeTrail({
      previewOutcomes: ['single', 'double'] as const,
      pendingCount: 0,
      centers: centers([
        { column: 0, outcome: 'miss', x: 110, y: 210, radius: 20 },
        { column: 0, outcome: 'single', x: 120, y: 220, radius: 20 },
        { column: 1, outcome: 'double', x: 220, y: 120, radius: 20 },
      ]),
      finger: { x: 250, y: 160 },
      origin: { x: 100, y: 100 },
    })

    expect(trail).toEqual({
      nodes: [
        { x: 20, y: 120 },
        { x: 120, y: 20 },
      ],
      finger: { x: 150, y: 60 },
    })
  })

  it('offsets columns by pendingCount and skips missing centers', () => {
    const trail = buildVisitOutcomeSwipeTrail({
      previewOutcomes: ['single', 'miss'] as const,
      pendingCount: 1,
      centers: centers([{ column: 1, outcome: 'single', x: 50, y: 50, radius: 10 }]),
      finger: null,
      origin: { x: 0, y: 0 },
    })

    expect(trail).toEqual({
      nodes: [{ x: 50, y: 50 }],
      finger: null,
    })
  })

  it('returns an empty trail when nothing is previewed', () => {
    expect(
      buildVisitOutcomeSwipeTrail({
        previewOutcomes: [],
        pendingCount: 0,
        centers: [],
        finger: { x: 10, y: 20 },
        origin: { x: 0, y: 0 },
      }),
    ).toEqual({
      nodes: [],
      finger: { x: 10, y: 20 },
    })
  })
})
