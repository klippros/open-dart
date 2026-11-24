import type { ComponentProps } from 'react'
import { chakra } from '@chakra-ui/react'
import { dropdownControlCss } from './dropdownControlCss'

export const DropdownTrigger = (props: ComponentProps<typeof chakra.button>) => (
  <chakra.button type="button" css={dropdownControlCss} {...props} />
)
