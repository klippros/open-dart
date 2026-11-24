import { Box, Button, Stack, Text } from '@chakra-ui/react'
import { useCallback, useMemo, useState } from 'react'
import { getRecentJdcChallengeBadge } from '@open-dart/analytics'
import { countTotalDartsThrown } from '@open-dart/analytics/visitStats'
import type { DateRangePreset } from '@open-dart/analytics/sessionFilters'
import {
  getLegNumberFromTimelinePointId,
  getSessionIdFromTimelinePointId,
} from '@open-dart/analytics/x01LegSlices'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { ContentContainer } from '../components/ContentContainer'
import { DisplayNameEditor } from '../components/DisplayNameEditor/DisplayNameEditor'
import { SessionSummaryDialog } from '../components/MatchSummaryDialog/SessionSummaryDialog'
import { OwnProfileHistory } from '../components/OwnProfileHistory/OwnProfileHistory'
import { OwnProfileStats } from '../components/OwnProfileStats/OwnProfileStats'
import { ProfileFollowCounts } from '../components/ProfileFollowCounts/ProfileFollowCounts'
import { ProfileDateRangeSelect } from '../components/ProfilePageHeader/ProfileDateRangeSelect'
import { ProfileDisplayName } from '../components/ProfilePageHeader/ProfileDisplayName'
import { ProfilePageHeader } from '../components/ProfilePageHeader/ProfilePageHeader'
import { SignInDialog } from '../components/SignInDialog/SignInDialog'
import { StatTimelineDialog } from '../components/StatTimelineDialog/StatTimelineDialog'
import { useAuth } from '../hooks/authContext'
import { useOwnProfileSessions } from '../hooks/useOwnProfileSessions'
import { buildStatTimeline } from '../lib/analytics/statTimelines'
import type { StatTimelinePoint, StatTimelineSelection } from '../lib/analytics/statTimelines'
import { formatInteger } from '../lib/analytics/formatAnalytics'
import type { ProfileBestSource } from '../lib/profile/profileCards'
import { isSignInEnabled } from '../lib/klipprosHost'
import { DEFAULT_PROFILE_DATE_RANGE } from '../lib/profile/profileDateRange'
import { AuthStatus } from '../types/auth'

export const ProfilePage = () => {
  const { authStatus, user, profile, isConfigured, setDisplayName } = useAuth()
  const [dateRange, setDateRange] = useState<DateRangePreset>(DEFAULT_PROFILE_DATE_RANGE)
  const [signInDialogOpen, setSignInDialogOpen] = useState(false)
  const [displayNameDialogOpen, setDisplayNameDialogOpen] = useState(false)
  const [timelineSelection, setTimelineSelection] = useState<StatTimelineSelection | null>(null)
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null)
  const [selectedLegNumber, setSelectedLegNumber] = useState<number | null>(null)
  const { storedSessions, allSessions, filteredSessions, analytics, reloadStoredSessions } =
    useOwnProfileSessions(dateRange)

  const dartsThrown = countTotalDartsThrown(filteredSessions)
  const isSignedIn = authStatus === AuthStatus.Authenticated && user !== null
  const canSignIn = isSignInEnabled && isConfigured
  const jersey = useMemo(() => getRecentJdcChallengeBadge(allSessions), [allSessions])
  const displayName = profile?.displayName ?? 'Player'

  const activeTimeline = useMemo(
    () =>
      timelineSelection === null ? null : buildStatTimeline(filteredSessions, timelineSelection),
    [filteredSessions, timelineSelection],
  )

  const openBestSource = useCallback(
    (source: ProfileBestSource) => {
      const session = allSessions.find((candidate) => candidate.id === source.sessionId) ?? null

      if (session !== null) {
        setSelectedSession(session)
        setSelectedLegNumber(source.legNumber)
      }
    },
    [allSessions],
  )

  const handleTimelinePointClick = useCallback(
    (point: StatTimelinePoint) => {
      const sessionId = getSessionIdFromTimelinePointId(point.sessionId)
      const session = allSessions.find((candidate) => candidate.id === sessionId) ?? null

      if (session !== null) {
        setSelectedSession(session)
        setSelectedLegNumber(getLegNumberFromTimelinePointId(point.sessionId))
      }
    },
    [allSessions],
  )

  const identity = isSignedIn ? (
    <ProfileDisplayName
      name={displayName}
      onEdit={() => {
        setDisplayNameDialogOpen(true)
      }}
    />
  ) : canSignIn && authStatus === AuthStatus.Anonymous ? (
    <Button
      variant="cta"
      onClick={() => {
        setSignInDialogOpen(true)
      }}
    >
      Sign in to sync
    </Button>
  ) : canSignIn ? null : (
    <ProfileDisplayName name="Profile" />
  )

  return (
    <ContentContainer>
      <Box py={{ base: 6, md: 10 }} pb={10} maxW="960px" w="full" mx="auto">
        <Stack gap={8}>
          <ProfilePageHeader
            jersey={jersey}
            identity={identity}
            social={isSignedIn ? <ProfileFollowCounts /> : null}
            meta={
              <Text
                fontFamily="Archivo Black, sans-serif"
                fontSize="2xl"
                lineHeight="1"
                color="white"
                whiteSpace="nowrap"
              >
                {formatInteger(dartsThrown)} {dartsThrown === 1 ? 'Dart' : 'Darts'}
              </Text>
            }
            dateControl={<ProfileDateRangeSelect value={dateRange} onChange={setDateRange} />}
          />
          <OwnProfileStats
            sessions={filteredSessions}
            analytics={analytics}
            onStatSelect={setTimelineSelection}
            onOpenBest={openBestSource}
          />
          <OwnProfileHistory
            storedSessions={storedSessions}
            onStoredSessionsChange={reloadStoredSessions}
          />
        </Stack>
      </Box>
      <StatTimelineDialog
        open={timelineSelection !== null}
        timeline={activeTimeline}
        onClose={() => {
          setTimelineSelection(null)
        }}
        onPointClick={handleTimelinePointClick}
      />
      <SessionSummaryDialog
        open={selectedSession !== null}
        session={selectedSession}
        initialLegNumber={selectedLegNumber}
        onClose={() => {
          setSelectedSession(null)
          setSelectedLegNumber(null)
        }}
      />
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
