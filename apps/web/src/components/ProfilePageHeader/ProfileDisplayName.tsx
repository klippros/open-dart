import { Button, Heading, HStack } from '@chakra-ui/react'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { profileNameHeight, toolbarControlSize } from '../../layout'

export interface ProfileDisplayNameProps {
  name: string
  onEdit?: () => void
}

export const ProfileDisplayName = ({ name, onEdit }: ProfileDisplayNameProps) => (
  <HStack gap={1} minW={0} maxW="full" flex="1 1 auto">
    <Heading
      as="h1"
      size="2xl"
      color="white"
      fontFamily="Archivo Black, sans-serif"
      lineHeight={profileNameHeight}
      title={name}
      truncate
      minW={0}
      flex="0 1 auto"
    >
      {name}
    </Heading>
    {onEdit !== undefined ? (
      <Button
        aria-label="Edit name"
        variant="ghost"
        color="whiteAlpha.800"
        minW={toolbarControlSize}
        w={toolbarControlSize}
        h={toolbarControlSize}
        p={0}
        flexShrink={0}
        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
        onClick={onEdit}
      >
        <FontAwesomeIcon icon={faPen} />
      </Button>
    ) : null}
  </HStack>
)
