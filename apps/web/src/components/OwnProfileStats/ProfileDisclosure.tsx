import { Button, Collapsible } from '@chakra-ui/react'
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import type { ReactNode } from 'react'

export interface ProfileDisclosureProps {
  label: string
  children: ReactNode
}

export const ProfileDisclosure = ({ label, children }: ProfileDisclosureProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open)
      }}
    >
      <Collapsible.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          color="whiteAlpha.800"
          fontWeight="normal"
          px={2}
          gap={2}
          _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
        >
          <FontAwesomeIcon icon={open ? faChevronDown : faChevronRight} />
          {label}
        </Button>
      </Collapsible.Trigger>
      <Collapsible.Content>{children}</Collapsible.Content>
    </Collapsible.Root>
  )
}
