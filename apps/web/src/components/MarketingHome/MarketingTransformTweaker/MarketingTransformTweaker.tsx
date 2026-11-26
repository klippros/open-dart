import { Box, Button, HStack, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { formatMarketingGraphicTransform } from '../marketingGraphicChrome'
import {
  MarketingGraphicTarget,
  useMarketingGraphicTransform,
} from '../marketingGraphicTransformContext'
import { MarketingTransformDial } from './MarketingTransformDial'
import { MarketingTransformField } from './MarketingTransformField'

/**
 * DEV-only Figma-style 3D transform panel for marketing hero graphics.
 */
export const MarketingTransformTweaker = () => {
  const { target, setTarget, active, setActive, resetActive, board, ninetyNine } =
    useMarketingGraphicTransform()
  const [copied, setCopied] = useState(false)

  const css = formatMarketingGraphicTransform(active)
  const snippet =
    target === MarketingGraphicTarget.Board
      ? `export const MARKETING_BOARD_TRANSFORM_VALUES = ${JSON.stringify(board, null, 2)}`
      : `export const MARKETING_NINETY_NINE_TRANSFORM_VALUES = ${JSON.stringify(ninetyNine, null, 2)}`

  const copyValues = async () => {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    window.setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  return (
    <Box
      position="fixed"
      right={4}
      bottom={4}
      zIndex={10000}
      w="240px"
      bg="#1e1e1e"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="10px"
      boxShadow="0 12px 40px rgba(0,0,0,0.45)"
      overflow="hidden"
      fontFamily="Inter, system-ui, sans-serif"
    >
      <HStack
        px={3}
        py={2}
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        justify="space-between"
      >
        <HStack gap={2}>
          <Text fontSize="12px" color="white" fontWeight="600">
            3D transform
          </Text>
          <Box
            px={1.5}
            py={0.5}
            borderRadius="full"
            bg="whiteAlpha.200"
            fontSize="9px"
            color="whiteAlpha.800"
            fontWeight="600"
            letterSpacing="0.02em"
          >
            Beta
          </Box>
        </HStack>
        <Button
          size="xs"
          variant="ghost"
          color="whiteAlpha.700"
          minW="auto"
          h="22px"
          px={1.5}
          fontSize="11px"
          onClick={resetActive}
          title="Reset to saved defaults"
        >
          Reset
        </Button>
      </HStack>

      <Box p={3}>
        <HStack gap={1} mb={3}>
          {(
            [
              [MarketingGraphicTarget.Board, 'Board'],
              [MarketingGraphicTarget.NinetyNine, '99 Darts'],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="xs"
              flex={1}
              h="26px"
              fontSize="11px"
              borderRadius="6px"
              bg={target === id ? '#0d99ff' : '#3a3a3a'}
              color="white"
              _hover={{ bg: target === id ? '#0d99ff' : '#4a4a4a' }}
              onClick={() => {
                setTarget(id)
              }}
            >
              {label}
            </Button>
          ))}
        </HStack>

        <MarketingTransformDial value={active} onChange={setActive} />

        <Stack gap={2} mt={3}>
          <Text fontSize="10px" color="whiteAlpha.500" fontWeight="600" letterSpacing="0.06em">
            ROTATION
          </Text>
          <MarketingTransformField
            label="X"
            value={active.rotateX}
            suffix="°"
            onChange={(rotateX) => {
              setActive({ ...active, rotateX })
            }}
          />
          <MarketingTransformField
            label="Y"
            value={active.rotateY}
            suffix="°"
            onChange={(rotateY) => {
              setActive({ ...active, rotateY })
            }}
          />
          <MarketingTransformField
            label="Z"
            value={active.rotateZ}
            suffix="°"
            onChange={(rotateZ) => {
              setActive({ ...active, rotateZ })
            }}
          />
          <Text
            fontSize="10px"
            color="whiteAlpha.500"
            fontWeight="600"
            letterSpacing="0.06em"
            mt={1}
          >
            DEPTH
          </Text>
          <MarketingTransformField
            label="↕"
            value={active.depth}
            suffix="px"
            onChange={(depth) => {
              setActive({ ...active, depth })
            }}
          />
        </Stack>

        <Box
          mt={3}
          p={2}
          bg="#2c2c2c"
          borderRadius="6px"
          fontSize="10px"
          color="whiteAlpha.700"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          wordBreak="break-all"
          lineHeight="1.4"
        >
          {css}
        </Box>

        <Button
          mt={2}
          w="full"
          size="xs"
          h="28px"
          bg="#3a3a3a"
          color="white"
          fontSize="11px"
          borderRadius="6px"
          _hover={{ bg: '#4a4a4a' }}
          onClick={() => {
            void copyValues()
          }}
        >
          {copied ? 'Copied values' : 'Copy values for chrome.ts'}
        </Button>
      </Box>
    </Box>
  )
}
