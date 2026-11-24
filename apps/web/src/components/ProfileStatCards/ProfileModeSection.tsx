import { Flex, Grid, Heading, Stack } from '@chakra-ui/react'
import type { ReactNode } from 'react'

export interface ProfileModeSectionProps {
  title: string
  trailing?: ReactNode
  children: ReactNode
}

export const ProfileModeSection = ({ title, trailing, children }: ProfileModeSectionProps) => (
  <Stack as="section" gap={3} aria-label={title}>
    <Grid
      templateColumns={
        trailing === undefined || trailing === null ? 'minmax(0, 1fr)' : 'auto minmax(0, 1fr)'
      }
      alignItems="start"
      columnGap={3}
    >
      <Heading as="h2" size="lg" color="white" fontFamily="Archivo Black, sans-serif">
        {title}
      </Heading>
      {trailing === undefined || trailing === null ? null : (
        <Flex minW={0} w="full" justify="flex-end" align="start">
          {trailing}
        </Flex>
      )}
    </Grid>
    {children}
  </Stack>
)
