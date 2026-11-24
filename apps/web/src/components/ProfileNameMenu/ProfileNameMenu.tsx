import { useState } from 'react'
import { Button, Popover, Portal, Stack } from '@chakra-ui/react'
import { faEllipsis } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { toolbarControlSize } from '../../layout'
import { darkDialogContentProps } from '../darkDialogContentProps'
import { SettingsDismissBackdrop } from '../SettingsMenu/SettingsDismissBackdrop'

export interface ProfileNameMenuProps {
  onReportName: () => void
}

export const ProfileNameMenu = ({ onReportName }: ProfileNameMenuProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root
      open={open}
      positioning={{ placement: 'bottom-start' }}
      onOpenChange={(details) => {
        setOpen(details.open)
      }}
    >
      <Popover.Trigger asChild>
        <Button
          aria-label="Profile actions"
          variant="ghost"
          color="whiteAlpha.800"
          minW={toolbarControlSize}
          w={toolbarControlSize}
          h={toolbarControlSize}
          p={0}
          flexShrink={0}
          _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
          _expanded={{ color: 'white', bg: 'whiteAlpha.100' }}
        >
          <FontAwesomeIcon icon={faEllipsis} />
        </Button>
      </Popover.Trigger>
      <Portal>
        {open && (
          <SettingsDismissBackdrop
            onDismiss={() => {
              setOpen(false)
            }}
          />
        )}
        <Popover.Positioner css={{ '--z-index': 'zIndex.popover' }}>
          <Popover.Content
            bg={darkDialogContentProps.bg}
            borderWidth={darkDialogContentProps.borderWidth}
            borderColor={darkDialogContentProps.borderColor}
            color={darkDialogContentProps.color}
            borderRadius="xl"
            shadow="2xl"
            minW="220px"
            overflow="hidden"
            p={0}
            _focusVisible={{ outline: 'none' }}
          >
            <Popover.Body px={3} py={3}>
              <Stack gap={2}>
                <Button
                  variant="cancel"
                  w="full"
                  justifyContent="flex-start"
                  onClick={() => {
                    setOpen(false)
                    onReportName()
                  }}
                >
                  Report name
                </Button>
              </Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  )
}
