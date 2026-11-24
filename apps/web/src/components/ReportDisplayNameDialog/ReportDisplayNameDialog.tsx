import { Button, Dialog, Portal, Text } from '@chakra-ui/react'
import { darkDialogContentProps } from '../darkDialogContentProps'

export interface ReportDisplayNameDialogProps {
  open: boolean
  displayName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const ReportDisplayNameDialog = ({
  open,
  displayName,
  onOpenChange,
  onConfirm,
}: ReportDisplayNameDialogProps) => (
  <Dialog.Root
    open={open}
    placement="center"
    onOpenChange={(details) => {
      onOpenChange(details.open)
    }}
  >
    <Portal>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg={darkDialogContentProps.bg}
          borderWidth={darkDialogContentProps.borderWidth}
          borderColor={darkDialogContentProps.borderColor}
          color={darkDialogContentProps.color}
          shadow={darkDialogContentProps.shadow}
        >
          <Dialog.Header>
            <Dialog.Title color="white">Report this name?</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.55">
              This sends “{displayName}” for review. Use it when the name is offensive, abusive, or
              breaks the name rules. We review the name as it appears now. Reporting does not block
              this player or change who you follow.
            </Text>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.ActionTrigger asChild>
              <Button variant="cancel">Cancel</Button>
            </Dialog.ActionTrigger>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm()
              }}
            >
              Report name
            </Button>
          </Dialog.Footer>
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
)
