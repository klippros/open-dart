import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  MARKETING_BOARD_TRANSFORM_VALUES,
  MARKETING_NINETY_NINE_TRANSFORM_VALUES,
} from './marketingGraphicChrome'
import {
  MarketingGraphicTarget,
  MarketingGraphicTransformContext,
} from './marketingGraphicTransformContext'

export const MarketingGraphicTransformProvider = ({ children }: { children: ReactNode }) => {
  const [target, setTarget] = useState(MarketingGraphicTarget.Board)
  const [board, setBoard] = useState(MARKETING_BOARD_TRANSFORM_VALUES)
  const [ninetyNine, setNinetyNine] = useState(MARKETING_NINETY_NINE_TRANSFORM_VALUES)
  const active = target === MarketingGraphicTarget.Board ? board : ninetyNine

  const value = useMemo(
    () => ({
      target,
      setTarget,
      board,
      ninetyNine,
      active,
      setActive: (next: typeof board) => {
        if (target === MarketingGraphicTarget.Board) {
          setBoard(next)
          return
        }
        setNinetyNine(next)
      },
      resetActive: () => {
        if (target === MarketingGraphicTarget.Board) {
          setBoard(MARKETING_BOARD_TRANSFORM_VALUES)
          return
        }
        setNinetyNine(MARKETING_NINETY_NINE_TRANSFORM_VALUES)
      },
    }),
    [target, board, ninetyNine, active],
  )

  return (
    <MarketingGraphicTransformContext.Provider value={value}>
      {children}
    </MarketingGraphicTransformContext.Provider>
  )
}
