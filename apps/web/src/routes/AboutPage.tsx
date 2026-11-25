import { Box, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { ContentContainer } from '../components/ContentContainer'

export const AboutPage = () => (
  <ContentContainer>
    <Box py={{ base: 6, md: 10 }} pb={10}>
      <Stack gap={8} maxW="720px" w="full" mx="auto">
        <Stack gap={3}>
          <Heading as="h1" size="2xl" color="white" fontFamily="Archivo Black, sans-serif">
            About Open Dart
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Open Dart is an open source darts scoring app built to get you playing as fast as
            possible. Jump into 501, 301, Bob&apos;s 27, 121, Around the Clock, and more. Whether
            you are practicing alone or playing with friends, there is a mode for it.
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Sign up to track your progress between devices, or keep playing locally. Open Dart
            stores every dart you track, giving you the data to see how you are improving: averages,
            checkout rates, trends across games, and how each practice session adds up over time.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Privacy
          </Heading>
          <Text color="whiteAlpha.700" fontSize="sm" lineHeight="1.65">
            In-progress games stay on your device. Completed games are saved locally and sync to
            your account when you sign in. Signed-in players can see your display name, online match
            summaries, and a limited stats snapshot on your profile. No account is required to play.
            Read the full{' '}
            <Link asChild color="whiteAlpha.900" textDecoration="underline">
              <RouterLink to="/privacy-policy">Privacy Policy</RouterLink>
            </Link>
            .
          </Text>
        </Stack>
      </Stack>
    </Box>
  </ContentContainer>
)
