import { Button, Dialog, Text } from '@chakra-ui/react'
import { darkDialogContentProps } from '../darkDialogContentProps'

export interface DeleteSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting?: boolean
  errorMessage?: string | null
}

export const DeleteSessionDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
  errorMessage = null,
}: DeleteSessionDialogProps) => (
  <Dialog.Root
    open={open}
    placement="center"
    onOpenChange={(details) => {
      if (isDeleting) {
        return
      }

      onOpenChange(details.open)
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
      >
        <Dialog.Header>
          <Dialog.Title color="white">Delete this game?</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.55">
            Delete this game from your history? This cannot be undone.
          </Text>
          {errorMessage !== null ? (
            <Text fontSize="sm" color="red.300" lineHeight="1.55" mt={3}>
              {errorMessage}
            </Text>
          ) : null}
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.ActionTrigger asChild>
            <Button variant="cancel" disabled={isDeleting}>
              Cancel
            </Button>
          </Dialog.ActionTrigger>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={() => {
              onConfirm()
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete game'}
          </Button>
        </Dialog.Footer>
        <Dialog.CloseTrigger disabled={isDeleting} />
      </Dialog.Content>
    </Dialog.Positioner>
  </Dialog.Root>
)
