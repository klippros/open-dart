import { Box } from '@chakra-ui/react'

interface MarketingTransformCubeFaceProps {
  label: string
  transform: string
}

export const MarketingTransformCubeFace = ({
  label,
  transform,
}: MarketingTransformCubeFaceProps) => (
  <Box
    position="absolute"
    inset={0}
    border="1px solid"
    borderColor="whiteAlpha.400"
    bg="rgba(90, 90, 90, 0.92)"
    display="flex"
    alignItems="center"
    justifyContent="center"
    fontSize="9px"
    color="whiteAlpha.700"
    letterSpacing="0.04em"
    textTransform="uppercase"
    style={{
      transform,
      backfaceVisibility: 'hidden',
    }}
  >
    {label}
  </Box>
)
