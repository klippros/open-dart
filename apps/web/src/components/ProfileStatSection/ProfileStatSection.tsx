import { Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import type { ProfileStatRow } from '../../lib/profile/formatProfileStats'
import { StatCard } from '../StatsPageSections/StatCard'

export interface ProfileStatSectionProps {
  title: string
  windowLabel: string
  rows: ProfileStatRow[]
}

export const ProfileStatSection = ({ title, windowLabel, rows }: ProfileStatSectionProps) => {
  if (rows.length === 0) {
    return null
  }

  return (
    <Stack gap={3}>
      <Stack gap={1}>
        <Heading as="h2" size="lg" color="white" fontFamily="Archivo Black, sans-serif">
          {title}
        </Heading>
        <Text fontSize="sm" color="whiteAlpha.600">
          {windowLabel}
        </Text>
      </Stack>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
        {rows.map((row) => (
          <StatCard key={row.label} label={row.label} value={row.value} />
        ))}
      </SimpleGrid>
    </Stack>
  )
}
