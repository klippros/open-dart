import { Box, Button, Stack, Text } from '@chakra-ui/react'
import { isOpenDartHost, OPEN_DART_APP_URL, readBrowserHostname } from '../../lib/klipprosHost'
import { LOCAL_EXPORT_FILENAME, buildLocalExport } from '../../lib/storage/localExport'

const downloadLocalExport = (): void => {
  const payload = JSON.stringify(buildLocalExport(), null, 2)
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = LOCAL_EXPORT_FILENAME
  anchor.click()
  URL.revokeObjectURL(url)
}

export const MoveToOpenDartBanner = () => {
  if (isOpenDartHost(readBrowserHostname())) {
    return null
  }

  return (
    <Box px={{ base: 4, md: 6 }} pt={4}>
      <Box
        borderWidth="1px"
        borderColor="orange.300"
        borderRadius="lg"
        bg="rgba(237, 137, 54, 0.16)"
        px={5}
        py={4}
      >
        <Stack gap={3}>
          <Text fontWeight="semibold" color="white">
            Open Darts is moving to opendart.app
          </Text>
          <Stack
            direction={{ base: 'column', sm: 'row' }}
            gap={4}
            align={{ sm: 'center' }}
            justify="space-between"
          >
            <Box
              as="ul"
              flex="1"
              m={0}
              ps={5}
              color="whiteAlpha.800"
              fontSize="sm"
              listStyleType="disc"
              listStylePosition="outside"
            >
              <Text as="li" display="list-item">
                This site will stay online until{' '}
                <Text as="span" fontWeight="bold" color="white">
                  Dec 19 2027
                </Text>
              </Text>
              <Text as="li" display="list-item">
                Signed-in user stats moved to opendart.app automatically
              </Text>
              <Text as="li" display="list-item">
                Local stats can be downloaded and imported
              </Text>
              <Text as="li" display="list-item">
                Press the settings gear and import data
              </Text>
            </Box>
            <Stack direction="column" gap={2} flexShrink={0} align="stretch">
              <Button
                variant="emphasis"
                onClick={() => {
                  downloadLocalExport()
                }}
              >
                Download your data
              </Button>
              <Button asChild variant="success">
                <a href={OPEN_DART_APP_URL}>Continue on opendart.app</a>
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
