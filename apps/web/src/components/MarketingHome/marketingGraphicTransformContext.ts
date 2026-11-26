import { createContext, useContext } from 'react'
import type { MarketingGraphicTransform } from './marketingGraphicChrome'

export enum MarketingGraphicTarget {
  Board = 'board',
  NinetyNine = 'ninetyNine',
}

export interface MarketingGraphicTransformContextValue {
  target: MarketingGraphicTarget
  setTarget: (target: MarketingGraphicTarget) => void
  board: MarketingGraphicTransform
  ninetyNine: MarketingGraphicTransform
  active: MarketingGraphicTransform
  setActive: (next: MarketingGraphicTransform) => void
  resetActive: () => void
}

export const MarketingGraphicTransformContext =
  createContext<MarketingGraphicTransformContextValue | null>(null)

export const useMarketingGraphicTransform = (): MarketingGraphicTransformContextValue => {
  const value = useContext(MarketingGraphicTransformContext)
  if (!value) {
    throw new Error(
      'useMarketingGraphicTransform must be used within MarketingGraphicTransformProvider',
    )
  }
  return value
}

/** Safe when the DEV tweaker provider is not mounted. */
export const useMarketingGraphicTransformOptional = () =>
  useContext(MarketingGraphicTransformContext)
