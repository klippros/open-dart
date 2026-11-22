import { Grid, Stack } from '@chakra-ui/react'
import { useCallback, useMemo } from 'react'
import { VisitDartSlotCard } from '../../Scoreboard/VisitDartSlotCard'
import { PressScaleButton } from '../../PressScaleButton/PressScaleButton'
import { scoringActionTypeProps } from '../../../scoringType'
import { useUiSounds } from '../../../hooks/useUiSounds'
import {
  buildJdcChallengeDoubleThrow,
  buildJdcChallengeShanghaiThrow,
} from '@open-dart/game/jdcChallenge/buildJdcChallengeDarts'
import {
  getJdcChallengeDartTarget,
  getJdcChallengeDoubleOutcome,
  getJdcChallengeShanghaiOutcome,
  getJdcChallengeTargetLabel,
  JDC_CHALLENGE_MAX_DARTS_PER_VISIT,
  getJdcChallengePartForVisit,
} from '@open-dart/game/jdcChallenge/jdcChallengeRules'
import {
  JdcChallengeDoubleOutcome,
  JdcChallengePart,
  JdcChallengeShanghaiOutcome,
  JdcChallengeTargetKind,
} from '@open-dart/game/types/jdcChallenge'
import type { DartThrow } from '@open-dart/game/types/dart'
import { useVisitOutcomeSwipe } from '../visitOutcomeSwipe/useVisitOutcomeSwipe'

export interface JdcChallengeDartPickerProps {
  visitIndex: number
  pendingDarts: DartThrow[]
  /** Append only new darts — must not re-send already pending throws. */
  onDarts: (darts: DartThrow[]) => void
  onUndo: () => void
  inputDisabled?: boolean
  undoDisabled?: boolean
}

type ShanghaiSwipeOutcome = JdcChallengeShanghaiOutcome
type DoubleSwipeOutcome = JdcChallengeDoubleOutcome

const SHANGHAI_SWIPE_OUTCOMES = new Set<string>(Object.values(JdcChallengeShanghaiOutcome))
const DOUBLE_SWIPE_OUTCOMES = new Set<string>(Object.values(JdcChallengeDoubleOutcome))

const reverseForDisplay = <T,>(items: T[]): T[] => [...items].reverse()

const shanghaiSlotSize = (
  outcome: JdcChallengeShanghaiOutcome,
): 'comfortable' | 'comfortableHalf' =>
  outcome === JdcChallengeShanghaiOutcome.Double ? 'comfortableHalf' : 'comfortable'

const shanghaiLabel = (outcome: JdcChallengeShanghaiOutcome, targetNumber: number): string => {
  switch (outcome) {
    case JdcChallengeShanghaiOutcome.Miss:
      return 'Miss'
    case JdcChallengeShanghaiOutcome.Single:
      return `S${targetNumber}`
    case JdcChallengeShanghaiOutcome.Double:
      return `D${targetNumber}`
    case JdcChallengeShanghaiOutcome.Triple:
      return `T${targetNumber}`
    default: {
      const exhaustive: never = outcome
      return String(exhaustive)
    }
  }
}

const doubleLabel = (outcome: JdcChallengeDoubleOutcome, targetLabel: string): string =>
  outcome === JdcChallengeDoubleOutcome.Miss ? 'Miss' : targetLabel

const toneForMissable = (isMiss: boolean): 'red' | 'green' => (isMiss ? 'red' : 'green')

export const JdcChallengeDartPicker = ({
  visitIndex,
  pendingDarts,
  onDarts,
  onUndo,
  inputDisabled = false,
  undoDisabled = inputDisabled,
}: JdcChallengeDartPickerProps) => {
  const { playHit, playMiss } = useUiSounds()
  const part = getJdcChallengePartForVisit(visitIndex)
  const isDoubles = part === JdcChallengePart.Doubles
  const pendingCount = pendingDarts.length

  const shanghaiTargetNumber = useMemo(() => {
    const target = getJdcChallengeDartTarget(visitIndex, 0)
    return target.kind === JdcChallengeTargetKind.Shanghai ? target.value : 10
  }, [visitIndex])

  const shanghaiOutcomes = useMemo(
    () => [
      JdcChallengeShanghaiOutcome.Miss,
      JdcChallengeShanghaiOutcome.Single,
      JdcChallengeShanghaiOutcome.Triple,
      JdcChallengeShanghaiOutcome.Double,
    ],
    [],
  )
  const shanghaiDisplay = reverseForDisplay(shanghaiOutcomes)

  const doubleOutcomes = useMemo(
    () => [JdcChallengeDoubleOutcome.Miss, JdcChallengeDoubleOutcome.Hit],
    [],
  )
  const doubleDisplay = reverseForDisplay(doubleOutcomes)

  const recordShanghai = useCallback(
    (resolved: ShanghaiSwipeOutcome[]) => {
      if (inputDisabled || resolved.length === 0) {
        return
      }

      const remaining = JDC_CHALLENGE_MAX_DARTS_PER_VISIT - pendingCount
      const toRecord = resolved.slice(0, Math.max(0, remaining))
      if (toRecord.length === 0) {
        return
      }

      if (toRecord.every((outcome) => outcome === JdcChallengeShanghaiOutcome.Miss)) {
        playMiss()
      } else {
        playHit()
      }

      onDarts(
        toRecord.map((outcome) => buildJdcChallengeShanghaiThrow(outcome, shanghaiTargetNumber)),
      )
    },
    [inputDisabled, onDarts, pendingCount, playHit, playMiss, shanghaiTargetNumber],
  )

  const recordDoubles = useCallback(
    (resolved: DoubleSwipeOutcome[]) => {
      if (inputDisabled || resolved.length === 0) {
        return
      }

      const remaining = JDC_CHALLENGE_MAX_DARTS_PER_VISIT - pendingCount
      const toRecord = resolved.slice(0, Math.max(0, remaining))
      if (toRecord.length === 0) {
        return
      }

      if (toRecord.every((outcome) => outcome === JdcChallengeDoubleOutcome.Miss)) {
        playMiss()
      } else {
        playHit()
      }

      onDarts(
        toRecord.map((outcome, offset) => {
          const dartIndex = pendingCount + offset
          return buildJdcChallengeDoubleThrow(
            outcome,
            getJdcChallengeDartTarget(visitIndex, dartIndex),
          )
        }),
      )
    },
    [inputDisabled, onDarts, pendingCount, playHit, playMiss, visitIndex],
  )

  const isShanghaiSwipeOutcome = (value: string): value is ShanghaiSwipeOutcome =>
    SHANGHAI_SWIPE_OUTCOMES.has(value)

  const isDoubleSwipeOutcome = (value: string): value is DoubleSwipeOutcome =>
    DOUBLE_SWIPE_OUTCOMES.has(value)

  const parseShanghaiOutcome = (value: string): ShanghaiSwipeOutcome | null =>
    isShanghaiSwipeOutcome(value) ? value : null

  const parseDoubleOutcome = (value: string): DoubleSwipeOutcome | null =>
    isDoubleSwipeOutcome(value) ? value : null

  const shanghaiSwipe = useVisitOutcomeSwipe({
    parseOutcome: parseShanghaiOutcome,
    pendingCount,
    visitDartCount: JDC_CHALLENGE_MAX_DARTS_PER_VISIT,
    inputDisabled: inputDisabled || isDoubles,
    onCommit: recordShanghai,
  })

  const doublesSwipe = useVisitOutcomeSwipe({
    parseOutcome: parseDoubleOutcome,
    pendingCount,
    visitDartCount: JDC_CHALLENGE_MAX_DARTS_PER_VISIT,
    inputDisabled: inputDisabled || !isDoubles,
    onCommit: recordDoubles,
  })

  const swipe = isDoubles ? doublesSwipe : shanghaiSwipe

  return (
    <Stack gap={3}>
      <Grid
        ref={swipe.gridRef}
        templateColumns={`repeat(${JDC_CHALLENGE_MAX_DARTS_PER_VISIT}, 1fr)`}
        gap={3}
        touchAction={swipe.gridTouchAction}
        {...swipe.gridPointerProps}
      >
        {Array.from({ length: JDC_CHALLENGE_MAX_DARTS_PER_VISIT }, (_, slotIndex) => {
          const isThrown = slotIndex < pendingCount
          const tapTarget = swipe.isTapTarget(slotIndex)
          const isAvailableColumn = swipe.availableColumn === slotIndex
          const thrownDart = pendingDarts[slotIndex]
          const dartTarget = getJdcChallengeDartTarget(visitIndex, slotIndex)
          const dartTargetLabel = getJdcChallengeTargetLabel(dartTarget)

          if (isDoubles) {
            const previewOutcome = doublesSwipe.previewForColumn(slotIndex)
            const thrownOutcome =
              thrownDart === undefined ? null : getJdcChallengeDoubleOutcome(thrownDart, dartTarget)
            const selectedOutcome = isThrown ? thrownOutcome : previewOutcome

            return (
              <Stack key={slotIndex} gap={2}>
                {doubleDisplay.map((outcome) => {
                  const isSelected = selectedOutcome === outcome
                  const showActiveChrome =
                    selectedOutcome !== null ? isSelected : tapTarget || isAvailableColumn

                  return (
                    <Stack
                      key={outcome}
                      data-swipe-column={isThrown ? undefined : slotIndex}
                      data-swipe-outcome={isThrown ? undefined : outcome}
                      gap={0}
                    >
                      <VisitDartSlotCard
                        label={
                          selectedOutcome !== null
                            ? isSelected
                              ? doubleLabel(outcome, dartTargetLabel)
                              : null
                            : doubleLabel(outcome, dartTargetLabel)
                        }
                        variant={
                          selectedOutcome !== null
                            ? isSelected
                              ? 'thrown'
                              : 'empty'
                            : showActiveChrome
                              ? 'selectable'
                              : 'empty'
                        }
                        tone={
                          selectedOutcome !== null
                            ? isSelected
                              ? toneForMissable(outcome === JdcChallengeDoubleOutcome.Miss)
                              : 'neutral'
                            : showActiveChrome
                              ? toneForMissable(outcome === JdcChallengeDoubleOutcome.Miss)
                              : 'neutral'
                        }
                        size="comfortable"
                        showArrow={false}
                        disabled={selectedOutcome !== null ? true : !tapTarget}
                        ariaLabel={`${doubleLabel(outcome, dartTargetLabel)} on dart ${slotIndex + 1}`}
                        onClick={
                          selectedOutcome === null && tapTarget
                            ? () => {
                                doublesSwipe.handleSlotClick(outcome)
                              }
                            : undefined
                        }
                      />
                    </Stack>
                  )
                })}
              </Stack>
            )
          }

          const previewOutcome = shanghaiSwipe.previewForColumn(slotIndex)
          const thrownOutcome =
            thrownDart === undefined
              ? null
              : getJdcChallengeShanghaiOutcome(thrownDart, shanghaiTargetNumber)
          const selectedOutcome = isThrown ? thrownOutcome : previewOutcome

          return (
            <Stack key={slotIndex} gap={2}>
              {shanghaiDisplay.map((outcome) => {
                const isSelected = selectedOutcome === outcome
                const showActiveChrome =
                  selectedOutcome !== null ? isSelected : tapTarget || isAvailableColumn

                return (
                  <Stack
                    key={outcome}
                    data-swipe-column={isThrown ? undefined : slotIndex}
                    data-swipe-outcome={isThrown ? undefined : outcome}
                    gap={0}
                  >
                    <VisitDartSlotCard
                      label={
                        selectedOutcome !== null
                          ? isSelected
                            ? shanghaiLabel(outcome, shanghaiTargetNumber)
                            : null
                          : shanghaiLabel(outcome, shanghaiTargetNumber)
                      }
                      variant={
                        selectedOutcome !== null
                          ? isSelected
                            ? 'thrown'
                            : 'empty'
                          : showActiveChrome
                            ? 'selectable'
                            : 'empty'
                      }
                      tone={
                        selectedOutcome !== null
                          ? isSelected
                            ? toneForMissable(outcome === JdcChallengeShanghaiOutcome.Miss)
                            : 'neutral'
                          : showActiveChrome
                            ? toneForMissable(outcome === JdcChallengeShanghaiOutcome.Miss)
                            : 'neutral'
                      }
                      size={shanghaiSlotSize(outcome)}
                      showArrow={false}
                      disabled={selectedOutcome !== null ? true : !tapTarget}
                      ariaLabel={`${shanghaiLabel(outcome, shanghaiTargetNumber)} on dart ${slotIndex + 1}`}
                      onClick={
                        selectedOutcome === null && tapTarget
                          ? () => {
                              shanghaiSwipe.handleSlotClick(outcome)
                            }
                          : undefined
                      }
                    />
                  </Stack>
                )
              })}
            </Stack>
          )
        })}
      </Grid>

      <PressScaleButton
        variant="cta"
        {...scoringActionTypeProps}
        disabled={undoDisabled}
        onClick={onUndo}
      >
        Undo last dart
      </PressScaleButton>
    </Stack>
  )
}
