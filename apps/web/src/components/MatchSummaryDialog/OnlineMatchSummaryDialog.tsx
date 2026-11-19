import { Badge, Dialog, Stack, Text } from '@chakra-ui/react'
import {
  getOnlineMatchEndingLabel,
  getOnlineMatchSummaryHeader,
} from '../../lib/history/onlineHistorySummary'
import type { OnlineMatchHistoryRow } from '../../lib/matchServer/types'
import { darkDialogContentProps } from '../darkDialogContentProps'
import { MatchSummaryTitle } from '../SessionSummary/MatchSummaryTitle'

export interface OnlineMatchSummaryDialogProps {
  open: boolean
  match: OnlineMatchHistoryRow | null
  onClose: () => void
}

export const OnlineMatchSummaryDialog = ({
  open,
  match,
  onClose,
}: OnlineMatchSummaryDialogProps) => {
  if (match === null) {
    return null
  }

  const header = getOnlineMatchSummaryHeader(match)
  const endingLabel = getOnlineMatchEndingLabel(match.endingKind)
  const legsLabel = `${match.legsToWin} leg${match.legsToWin === 1 ? '' : 's'}`
  const opponentName = match.opponentDisplayName

  return (
    <Dialog.Root
      open={open}
      placement="center"
      onOpenChange={(details) => {
        if (!details.open) {
          onClose()
        }
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg={darkDialogContentProps.bg}
          borderWidth={darkDialogContentProps.borderWidth}
          borderColor={darkDialogContentProps.borderColor}
          color={darkDialogContentProps.color}
          shadow={darkDialogContentProps.shadow}
          w="full"
          maxW={{ base: 'calc(100vw - 2rem)', sm: '28rem', md: '36rem', lg: '42rem' }}
        >
          <Dialog.Header>
            <Dialog.Title color="white" w="full">
              <MatchSummaryTitle
                header={header}
                badge={
                  <Badge colorPalette="orange" variant="subtle">
                    Online
                  </Badge>
                }
              />
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Stack gap={1}>
              {opponentName !== null && (
                <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.55">
                  vs {opponentName}
                </Text>
              )}
              <Text fontSize="sm" color="whiteAlpha.700" lineHeight="1.55">
                {endingLabel} · {legsLabel}
              </Text>
            </Stack>
          </Dialog.Body>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
