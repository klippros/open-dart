import { Box, Button, Stack } from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { getCurrentMonthJdcChallengeBadge } from '@open-dart/analytics'
import type { DateRangePreset } from '@open-dart/analytics/sessionFilters'
import { ContentContainer } from '../components/ContentContainer'
import { DisplayNameEditor } from '../components/DisplayNameEditor/DisplayNameEditor'
import { ProfileFollowCounts } from '../components/ProfileFollowCounts/ProfileFollowCounts'
import { ProfileDateRangeSelect } from '../components/ProfilePageHeader/ProfileDateRangeSelect'
import { ProfileDisplayName } from '../components/ProfilePageHeader/ProfileDisplayName'
import { ProfilePageHeader } from '../components/ProfilePageHeader/ProfilePageHeader'
import { SignInDialog } from '../components/SignInDialog/SignInDialog'
import { useAuth } from '../hooks/authContext'
import { isSignInEnabled } from '../lib/klipprosHost'
import { DEFAULT_PROFILE_DATE_RANGE } from '../lib/profile/profileDateRange'
import { loadStoredSessions } from '../lib/storage/gameStore'
import { AuthStatus, SyncStatus } from '../types/auth'
import { HistoryPage } from './HistoryPage'
import { StatsPage } from './StatsPage'

export const ProfilePage = () => {
  const { authStatus, syncStatus, user, profile, isConfigured, setDisplayName } = useAuth()
  const [dateRange, setDateRange] = useState<DateRangePreset>(DEFAULT_PROFILE_DATE_RANGE)
  const [signInDialogOpen, setSignInDialogOpen] = useState(false)
  const [displayNameDialogOpen, setDisplayNameDialogOpen] = useState(false)
  const [storedSessions, setStoredSessions] = useState(() => loadStoredSessions())

  const isSignedIn = authStatus === AuthStatus.Authenticated && user !== null

  useEffect(() => {
    if (authStatus === AuthStatus.Anonymous || authStatus === AuthStatus.Authenticated) {
      setStoredSessions(loadStoredSessions())
    }
  }, [authStatus])

  useEffect(() => {
    if (syncStatus === SyncStatus.Synced) {
      setStoredSessions(loadStoredSessions())
    }
  }, [syncStatus])

  const jersey = useMemo(() => getCurrentMonthJdcChallengeBadge(storedSessions), [storedSessions])
  const displayName = profile?.displayName ?? 'Player'

  const identity = isSignedIn ? (
    <ProfileDisplayName
      name={displayName}
      onEdit={() => {
        setDisplayNameDialogOpen(true)
      }}
    />
  ) : isSignInEnabled && isConfigured && authStatus === AuthStatus.Anonymous ? (
    <Button
      variant="cta"
      onClick={() => {
        setSignInDialogOpen(true)
      }}
    >
      Sign in to sync
    </Button>
  ) : null

  return (
    <ContentContainer>
      <Box py={{ base: 6, md: 10 }} pb={10} maxW="960px" w="full" mx="auto">
        <Stack gap={8}>
          <ProfilePageHeader
            jersey={jersey}
            identity={identity}
            social={isSignedIn ? <ProfileFollowCounts /> : null}
            dateControl={<ProfileDateRangeSelect value={dateRange} onChange={setDateRange} />}
          />
          <StatsPage dateRange={dateRange} />
          <HistoryPage embedded />
        </Stack>
      </Box>
      {isSignedIn ? (
        <DisplayNameEditor
          open={displayNameDialogOpen}
          onOpenChange={setDisplayNameDialogOpen}
          currentName={displayName}
          onSaved={setDisplayName}
        />
      ) : null}
      <SignInDialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen} />
    </ContentContainer>
  )
}
