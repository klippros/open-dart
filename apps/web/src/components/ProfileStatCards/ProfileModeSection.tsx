import { Flex, Heading, Stack } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export interface ProfileModeSectionProps {
  title: string
  trailing?: ReactNode
  children: ReactNode
}

export const ProfileModeSection = ({ title, trailing, children }: ProfileModeSectionProps) => (
  <Stack as="section" gap={3} aria-label={title}>
    <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
      <Heading as="h2" size="lg" color="white" fontFamily="Archivo Black, sans-serif">
        {title}
      </Heading>
      {trailing}
    </Flex>
    {children}
  </Stack>
)
