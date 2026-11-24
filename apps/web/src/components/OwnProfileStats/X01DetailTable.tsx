import { Box, Flex, Text, chakra } from '@chakra-ui/react'
import type { StatTimelineSelection } from '../../lib/analytics/statTimelines'
import type { ProfileStatCardModel } from '../../lib/profile/profileCards'

export interface X01DetailTableProps {
  rows: ProfileStatCardModel[]
  onStatSelect?: (selection: StatTimelineSelection) => void
}

export const X01DetailTable = ({ rows, onStatSelect }: X01DetailTableProps) => (
  <Box
    mt={2}
    borderWidth="1px"
    borderColor="whiteAlpha.200"
    borderRadius="lg"
    bg="whiteAlpha.50"
    overflow="hidden"
  >
    {rows.map((row, index) => {
      const content = (
        <Flex justify="space-between" gap={3} px={4} py={2.5}>
          <Text fontSize="sm" color="whiteAlpha.800">
            {row.label}
          </Text>
          <Text fontSize="sm" color="white" fontWeight="semibold">
            {row.value}
          </Text>
        </Flex>
      )
      const borderTop = index === 0 ? undefined : '1px solid'

      if (row.timeline === null || onStatSelect === undefined) {
        return (
          <Box key={row.id} borderTop={borderTop} borderColor="whiteAlpha.100">
            {content}
          </Box>
        )
      }

      const { timeline } = row

      return (
        <chakra.button
          key={row.id}
          type="button"
          display="block"
          w="full"
          textAlign="left"
          cursor="pointer"
          borderTop={borderTop}
          borderColor="whiteAlpha.100"
          _hover={{ bg: 'whiteAlpha.100' }}
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'orange.300',
            outlineOffset: '-2px',
          }}
          onClick={() => {
            onStatSelect(timeline)
          }}
        >
          {content}
        </chakra.button>
      )
    })}
  </Box>
)
