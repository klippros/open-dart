import { Button, Dialog, Input, Portal, Stack, Text } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { DISPLAY_NAME_MAX_LENGTH, updateDisplayName } from '../../lib/profile/profileApi'
import type { DisplayNameUpdateError } from '../../lib/profile/profileApi'
import { darkDialogContentProps } from '../darkDialogContentProps'

export interface DisplayNameEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onSaved: (nextName: string) => void
}

const errorMessage = (error: DisplayNameUpdateError): string => {
  if (error === 'length') {
    return `Use 1 to ${DISPLAY_NAME_MAX_LENGTH} characters.`
  }
  if (error === 'chars') {
    return 'Use letters and numbers.'
  }
  if (error === 'blocked') {
    return 'Choose a less offensive name.'
  }
  return 'Could not save the name. Try again.'
}

export const DisplayNameEditor = ({
  open,
  onOpenChange,
  currentName,
  onSaved,
}: DisplayNameEditorProps) => {
  const [value, setValue] = useState(currentName)
  const [error, setError] = useState<DisplayNameUpdateError | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    setValue(currentName)
    setError(null)
    setSaving(false)
  }, [currentName, open])

  const trimmed = value.trim().replace(/\s+/gu, ' ')
  const canSave =
    trimmed.length >= 1 &&
    trimmed.length <= DISPLAY_NAME_MAX_LENGTH &&
    trimmed !== currentName &&
    !saving

  const handleSave = async () => {
    setSaving(true)
    const result = await updateDisplayName(trimmed)
    setSaving(false)
    if (result === null) {
      onSaved(trimmed)
      setError(null)
      onOpenChange(false)
      return
    }
    setError(result)
  }

  return (
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
            maxW="28rem"
          >
            <Dialog.Header>
              <Dialog.Title color="white">Display name</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={3}>
                <Text fontSize="sm" color="whiteAlpha.700">
                  Display name (1–{DISPLAY_NAME_MAX_LENGTH} characters)
                </Text>
                <Input
                  value={value}
                  maxLength={DISPLAY_NAME_MAX_LENGTH}
                  onChange={(event) => {
                    setValue(event.target.value)
                    setError(null)
                  }}
                  bg="whiteAlpha.100"
                  borderColor="whiteAlpha.300"
                  color="white"
                />
                {error !== null ? (
                  <Text fontSize="sm" color="red.300">
                    {errorMessage(error)}
                  </Text>
                ) : null}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="cancel">Cancel</Button>
              </Dialog.ActionTrigger>
              <Button
                variant="cta"
                disabled={!canSave}
                onClick={() => {
                  void handleSave()
                }}
              >
                Save
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
