import { useCallback, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { useSettings } from '../../../hooks/settingsContext'
import { buildVisitOutcomeSwipeTrail } from './buildVisitOutcomeSwipeTrail'
import type { VisitOutcomeSwipeTrail } from './buildVisitOutcomeSwipeTrail'
import {
  fieldCenterRadius,
  getVisitOutcomeSwipeCommit,
  resolveVisitOutcomeSwipe,
} from './visitOutcomeSwipe'
import type { VisitOutcomeFieldCenter, VisitOutcomeSwipeSample } from './visitOutcomeSwipe'

export interface UseVisitOutcomeSwipeOptions<TOutcome extends string> {
  parseOutcome: (value: string) => TOutcome | null
  pendingCount: number
  visitDartCount: number
  inputDisabled?: boolean
  onCommit: (outcomes: TOutcome[]) => void
}

export interface UseVisitOutcomeSwipeResult<TOutcome extends string> {
  gridRef: RefObject<HTMLDivElement | null>
  isSwiping: boolean
  availableColumn: number | null
  previewForColumn: (slotIndex: number) => TOutcome | null
  isTapTarget: (slotIndex: number) => boolean
  handleSlotClick: (outcome: TOutcome) => void
  gridTouchAction: 'none' | 'auto'
  swipeTrail: VisitOutcomeSwipeTrail | null
  gridPointerProps: {
    onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
    onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
    onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
    onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  }
}

export const useVisitOutcomeSwipe = <TOutcome extends string>({
  parseOutcome,
  pendingCount,
  visitDartCount,
  inputDisabled = false,
  onCommit,
}: UseVisitOutcomeSwipeOptions<TOutcome>): UseVisitOutcomeSwipeResult<TOutcome> => {
  const { enableInputSwiping } = useSettings()
  const gridRef = useRef<HTMLDivElement>(null)
  const samplesRef = useRef<VisitOutcomeSwipeSample<TOutcome>[]>([])
  const centersRef = useRef<VisitOutcomeFieldCenter<TOutcome>[]>([])
  const swipeActiveRef = useRef(false)
  const suppressClickRef = useRef(false)
  const parseOutcomeRef = useRef(parseOutcome)
  parseOutcomeRef.current = parseOutcome
  const onCommitRef = useRef(onCommit)
  onCommitRef.current = onCommit

  const [previewOutcomes, setPreviewOutcomes] = useState<TOutcome[]>([])
  const [fingerClient, setFingerClient] = useState<{ x: number; y: number } | null>(null)
  const isSwiping = previewOutcomes.length > 0

  const readFieldCenters = useCallback((): VisitOutcomeFieldCenter<TOutcome>[] => {
    const grid = gridRef.current

    if (grid === null) {
      return []
    }

    const centers: VisitOutcomeFieldCenter<TOutcome>[] = []

    for (const cell of grid.querySelectorAll<HTMLElement>('[data-swipe-column]')) {
      const column = Number(cell.dataset.swipeColumn)
      const outcomeValue = cell.dataset.swipeOutcome

      if (!Number.isInteger(column) || outcomeValue === undefined) {
        continue
      }

      const outcome = parseOutcomeRef.current(outcomeValue)

      if (outcome === null) {
        continue
      }

      const rect = cell.getBoundingClientRect()
      centers.push({
        column,
        outcome,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        radius: fieldCenterRadius(rect.width, rect.height),
      })
    }

    return centers
  }, [])

  const hitTest = useCallback(
    (clientX: number, clientY: number): { column: number; outcome: TOutcome } | null => {
      const grid = gridRef.current

      if (grid === null) {
        return null
      }

      const cells = grid.querySelectorAll<HTMLElement>('[data-swipe-column]')

      for (const cell of cells) {
        const rect = cell.getBoundingClientRect()

        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          continue
        }

        const column = Number(cell.dataset.swipeColumn)
        const outcomeValue = cell.dataset.swipeOutcome

        if (!Number.isInteger(column) || outcomeValue === undefined) {
          continue
        }

        const outcome = parseOutcomeRef.current(outcomeValue)

        if (outcome === null) {
          continue
        }

        return { column, outcome }
      }

      return null
    },
    [],
  )

  const appendSample = useCallback(
    (clientX: number, clientY: number) => {
      setFingerClient({ x: clientX, y: clientY })

      const hit = hitTest(clientX, clientY)
      const last = samplesRef.current.at(-1)
      const resolvedHit =
        hit ?? (last === undefined ? null : { column: last.column, outcome: last.outcome })

      if (resolvedHit === null) {
        return
      }

      const sample: VisitOutcomeSwipeSample<TOutcome> = {
        column: resolvedHit.column,
        outcome: resolvedHit.outcome,
        x: clientX,
        y: clientY,
      }

      samplesRef.current = [...samplesRef.current, sample]
      setPreviewOutcomes(
        resolveVisitOutcomeSwipe(samplesRef.current, pendingCount, centersRef.current),
      )
    },
    [hitTest, pendingCount],
  )

  const endSwipe = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!swipeActiveRef.current) {
        return
      }

      swipeActiveRef.current = false
      suppressClickRef.current = true

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      appendSample(event.clientX, event.clientY)
      const committed = getVisitOutcomeSwipeCommit(
        samplesRef.current,
        pendingCount,
        visitDartCount,
        centersRef.current,
      )
      samplesRef.current = []
      centersRef.current = []
      setPreviewOutcomes([])
      setFingerClient(null)
      onCommitRef.current(committed)
    },
    [appendSample, pendingCount, visitDartCount],
  )

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!enableInputSwiping || inputDisabled || pendingCount >= visitDartCount) {
        return
      }

      if (event.button !== 0) {
        return
      }

      const hit = hitTest(event.clientX, event.clientY)

      if (hit === null || hit.column !== pendingCount) {
        return
      }

      swipeActiveRef.current = true
      samplesRef.current = []
      centersRef.current = readFieldCenters()
      event.currentTarget.setPointerCapture(event.pointerId)
      appendSample(event.clientX, event.clientY)
    },
    [
      appendSample,
      enableInputSwiping,
      hitTest,
      inputDisabled,
      pendingCount,
      readFieldCenters,
      visitDartCount,
    ],
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!swipeActiveRef.current) {
        return
      }

      appendSample(event.clientX, event.clientY)
    },
    [appendSample],
  )

  const handleSlotClick = useCallback((outcome: TOutcome) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    onCommitRef.current([outcome])
  }, [])

  const tipColumn =
    isSwiping && !inputDisabled ? pendingCount + previewOutcomes.length - 1 : pendingCount
  const availableColumn =
    isSwiping && tipColumn + 1 < visitDartCount && !inputDisabled ? tipColumn + 1 : null

  const previewForColumn = useCallback(
    (slotIndex: number): TOutcome | null => {
      if (previewOutcomes.length === 0 || slotIndex < pendingCount) {
        return null
      }

      return previewOutcomes[slotIndex - pendingCount] ?? null
    },
    [pendingCount, previewOutcomes],
  )

  const isTapTarget = useCallback(
    (slotIndex: number): boolean => slotIndex === pendingCount && !inputDisabled && !isSwiping,
    [inputDisabled, isSwiping, pendingCount],
  )

  const swipeTrail = useMemo((): VisitOutcomeSwipeTrail | null => {
    if (!enableInputSwiping || (previewOutcomes.length === 0 && fingerClient === null)) {
      return null
    }

    const grid = gridRef.current
    const origin =
      grid === null
        ? { x: 0, y: 0 }
        : (() => {
            const rect = grid.getBoundingClientRect()
            return { x: rect.left, y: rect.top }
          })()

    return buildVisitOutcomeSwipeTrail({
      previewOutcomes,
      pendingCount,
      centers: centersRef.current,
      finger: fingerClient,
      origin,
    })
  }, [enableInputSwiping, fingerClient, pendingCount, previewOutcomes])

  return {
    gridRef,
    isSwiping,
    availableColumn,
    previewForColumn,
    isTapTarget,
    handleSlotClick,
    gridTouchAction: enableInputSwiping ? 'none' : 'auto',
    swipeTrail,
    gridPointerProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: endSwipe,
      onPointerCancel: endSwipe,
    },
  }
}
