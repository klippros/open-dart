import { useEffect, useState } from 'react'
import {
  isMarketingTransformTweakerEnabled,
  subscribeMarketingTransformTweaker,
} from './marketingTransformDebug'

/** DEV-only: whether the Figma-style 3D transform panel should render. */
export const useMarketingTransformTweakerEnabled = (): boolean => {
  const [enabled, setEnabled] = useState(isMarketingTransformTweakerEnabled)

  useEffect(
    () =>
      subscribeMarketingTransformTweaker(() => {
        setEnabled(isMarketingTransformTweakerEnabled())
      }),
    [],
  )

  return enabled
}
