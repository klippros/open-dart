import { HitCountDartPicker } from './HitCountDartPicker'
import { buildBigNumbersDartsForHitCount } from '@open-dart/game/bigNumbers/buildBigNumbersDarts'
import { getBigNumbersTargetLabel } from '@open-dart/game/bigNumbers/bigNumbersRules'
import type { DartThrow } from '@open-dart/game/types/dart'

export interface BigNumbersDartPickerProps {
  targetIndex: number
  onDarts: (darts: DartThrow[]) => void
  onUndo: () => void
  inputDisabled?: boolean
  undoDisabled?: boolean
}

export const BigNumbersDartPicker = ({
  targetIndex,
  onDarts,
  onUndo,
  inputDisabled = false,
  undoDisabled = inputDisabled,
}: BigNumbersDartPickerProps) => (
  <HitCountDartPicker
    targetLabel={getBigNumbersTargetLabel(targetIndex)}
    onHitCount={(hitCount) => {
      onDarts(buildBigNumbersDartsForHitCount(hitCount, targetIndex))
    }}
    onUndo={onUndo}
    inputDisabled={inputDisabled}
    undoDisabled={undoDisabled}
  />
)
