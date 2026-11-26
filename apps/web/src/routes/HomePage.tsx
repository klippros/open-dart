import { Box, Spinner, Stack } from '@chakra-ui/react'
import { Navigate } from 'react-router-dom'
import { useRef } from 'react'
import { ContentContainer } from '../components/ContentContainer'
import { MarketingAnalysisSection } from '../components/MarketingHome/MarketingAnalysisSection'
import { MarketingHero } from '../components/MarketingHome/MarketingHero'
import { MarketingModesSection } from '../components/MarketingHome/MarketingModesSection'
import { MarketingTransformTweaker } from '../components/MarketingHome/MarketingTransformTweaker/MarketingTransformTweaker'
import { MARKETING_SECTION_GAP } from '../components/MarketingHome/marketingGraphicChrome'
import { MarketingGraphicTransformProvider } from '../components/MarketingHome/MarketingGraphicTransformProvider'
import { useMarketingTransformTweakerEnabled } from '../components/MarketingHome/useMarketingTransformTweakerEnabled'
import { useAuth } from '../hooks/authContext'
import { hasAllowHome } from '../lib/navigation/homeEntry'
import { AuthStatus } from '../types/auth'

export const HomePage = () => {
  const { authStatus, user } = useAuth()
  const allowHomeRef = useRef(hasAllowHome())
  const showTransformTweaker = useMarketingTransformTweakerEnabled()
  const signedIn = authStatus === AuthStatus.Authenticated && user !== null

  if (authStatus === AuthStatus.Loading) {
    return (
      <ContentContainer>
        <Box py={{ base: 16, md: 24 }} display="flex" justifyContent="center">
          <Spinner color="white" />
        </Box>
      </ContentContainer>
    )
  }

  if (signedIn && !allowHomeRef.current) {
    return <Navigate to="/play" replace />
  }

  const content = (
    <ContentContainer>
      <Box py={{ base: 8, md: 10 }} pb={{ base: 12, md: 16 }} overflow="visible">
        <Stack gap={MARKETING_SECTION_GAP} align="center" w="full" overflow="visible">
          <Stack gap={0} align="center" w="full" overflow="visible">
            <MarketingHero />
            <MarketingModesSection />
          </Stack>
          <MarketingAnalysisSection />
        </Stack>
      </Box>
    </ContentContainer>
  )

  if (!showTransformTweaker) {
    return content
  }

  return (
    <MarketingGraphicTransformProvider>
      {content}
      <MarketingTransformTweaker />
    </MarketingGraphicTransformProvider>
  )
}
