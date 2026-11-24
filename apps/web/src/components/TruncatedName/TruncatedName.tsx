import { Text } from '@chakra-ui/react'
import type { TextProps } from '@chakra-ui/react'

export interface TruncatedNameProps extends Omit<TextProps, 'children'> {
  name: string
}

/** One-line name that shrinks to its parent and keeps the full value in the tooltip. */
export const TruncatedName = ({ name, ...props }: TruncatedNameProps) => (
  <Text {...props} truncate minW={0} maxW="100%" title={name}>
    {name}
  </Text>
)
