import { Box, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { ContentContainer } from '../components/ContentContainer'

export const ImpressumPage = () => (
  <ContentContainer>
    <Box py={{ base: 6, md: 10 }} pb={10}>
      <Stack gap={6} maxW="720px" w="full" mx="auto">
        <Heading as="h1" size="2xl" color="white" fontFamily="Archivo Black, sans-serif">
          Impressum
        </Heading>
        <Stack gap={3} color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
          <Text>
            <Text as="span" fontWeight="700" color="white">
              Company Name:
            </Text>{' '}
            Klippros Studios AB
          </Text>
          <Text>
            <Text as="span" fontWeight="700" color="white">
              Registered Office:
            </Text>{' '}
            Södra Viktoriagatan 46A, 411 30 Gothenburg, Sweden
          </Text>
          <Text>
            <Text as="span" fontWeight="700" color="white">
              Managing Director:
            </Text>{' '}
            Timon Lapawczyk
          </Text>
          <Text>
            <Text as="span" fontWeight="700" color="white">
              Company Registration Number:
            </Text>{' '}
            559543-6857
          </Text>
          <Text>
            <Text as="span" fontWeight="700" color="white">
              Email:
            </Text>{' '}
            <Link
              href="mailto:opendart@klippros.com"
              color="whiteAlpha.900"
              textDecoration="underline"
              textUnderlineOffset="2px"
              _hover={{ color: 'white' }}
            >
              opendart@klippros.com
            </Link>
          </Text>
        </Stack>
      </Stack>
    </Box>
  </ContentContainer>
)
