import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import type { PlayerProfileStats } from '@open-dart/analytics'
import { ContentContainer } from '../components/ContentContainer'
import { DisplayNameEditor } from '../components/DisplayNameEditor/DisplayNameEditor'
import { HistoryList } from '../components/HistoryList/HistoryList'
import type { HistoryListEntry } from '../components/HistoryList/HistoryList'
import { OnlineMatchSummaryDialog } from '../components/MatchSummaryDialog/OnlineMatchSummaryDialog'
import { SessionSummaryDialog } from '../components/MatchSummaryDialog/SessionSummaryDialog'
import { ProfileFollowButton } from '../components/ProfileFollowButton/ProfileFollowButton'
import { ProfileStatSection } from '../components/ProfileStatSection/ProfileStatSection'
import { SignInDialog } from '../components/SignInDialog/SignInDialog'
import { useAuth } from '../hooks/authContext'
import { toolbarControlSize } from '../layout'
import { isSignInEnabled } from '../lib/klipprosHost'
import { getOnlineMatchCompletedAt, HistoryEntrySource } from '../lib/history/onlineHistorySummary'
import { HISTORY_PAGE_SIZE } from '../lib/history/historyPager'
import { decorateOnlineSessionForViewer } from '../lib/matchServer/onlinePlay'
import type { OnlineMatchHistoryRow, OnlineMatchSummary } from '../lib/matchServer/types'
import {
  buildBigNumbersRows,
  buildBob27Rows,
  buildFiveOhOneRows,
  buildJdcChallengeRows,
  buildNinetyNineRows,
  profileHasAnyStats,
} from '../lib/profile/formatProfileStats'
import { ProfileJdcChallengeBadge } from '../components/ProfileJdcChallengeBadge/ProfileJdcChallengeBadge'
import {
  fetchPlayerProfileStats,
  isProfileUserId,
  listProfileOnlineMatches,
  openProfileMatchDetail,
  reportDisplayName,
} from '../lib/profile/profileApi'
import { AuthStatus } from '../types/auth'
import type { GameSession } from '@open-dart/game/types/gameSession'
import { resolveHumanPlayerName } from '@open-dart/game/game/playerFactory'

export const PlayerProfilePage = () => {
  const { userId: routeUserId } = useParams()
  const { user, profile, authStatus, isConfigured, setDisplayName } = useAuth()
  const [signInDialogOpen, setSignInDialogOpen] = useState(false)
  const [displayNameDialogOpen, setDisplayNameDialogOpen] = useState(false)
  const [stats, setStats] = useState<PlayerProfileStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [matches, setMatches] = useState<OnlineMatchSummary[]>([])
  const [hasMoreMatches, setHasMoreMatches] = useState(false)
  const [reportMessage, setReportMessage] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null)
  const [selectedOnlineMatch, setSelectedOnlineMatch] = useState<OnlineMatchHistoryRow | null>(null)

  const profileUserId = routeUserId ?? ''
  const isSignedIn = authStatus === AuthStatus.Authenticated && user !== null
  const isOwnProfile = isSignedIn && user.id === profileUserId
  const validUserId = isProfileUserId(profileUserId)

  useEffect(() => {
    const existing = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const previousContent = existing?.content
    const robots = existing ?? document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    if (existing === null) {
      document.head.append(robots)
    }

    return () => {
      if (existing === null) {
        robots.remove()
      } else {
        robots.content = previousContent ?? ''
      }
    }
  }, [])

  useEffect(() => {
    if (!isSignedIn || !validUserId || user === null) {
      setStats(null)
      setMatches([])
      return undefined
    }

    let cancelled = false
    setLoadingStats(true)
    setStatsError(null)

    const load = async () => {
      try {
        const [nextStats, nextMatches] = await Promise.all([
          fetchPlayerProfileStats(profileUserId),
          listProfileOnlineMatches(user.id, profileUserId, { limit: HISTORY_PAGE_SIZE }),
        ])
        if (cancelled) {
          return
        }
        setStats(nextStats)
        setMatches(nextMatches)
        setHasMoreMatches(nextMatches.length === HISTORY_PAGE_SIZE)
      } catch {
        if (!cancelled) {
          setStats(null)
          setMatches([])
          setStatsError('Could not load this profile.')
        }
      } finally {
        if (!cancelled) {
          setLoadingStats(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isSignedIn, profileUserId, user, validUserId])

  const historyEntries = useMemo((): HistoryListEntry[] => {
    if (user === null) {
      return []
    }

    return matches.map((match) => ({
      source: HistoryEntrySource.Online,
      id: match.id,
      sortAt: getOnlineMatchCompletedAt(match),
      match,
      canOpenDetail: match.playerUserIds.includes(user.id),
    }))
  }, [matches, user])

  const handleLoadMore = useCallback(async () => {
    if (user === null || !hasMoreMatches) {
      return
    }

    const last = matches.at(-1)
    if (last === undefined) {
      return
    }

    try {
      const more = await listProfileOnlineMatches(user.id, profileUserId, {
        beforeCompletedAt: getOnlineMatchCompletedAt(last),
        beforeId: last.id,
        limit: HISTORY_PAGE_SIZE,
      })
      setMatches((current) => {
        const known = new Set(current.map((match) => match.id))
        return [...current, ...more.filter((match) => !known.has(match.id))]
      })
      setHasMoreMatches(more.length === HISTORY_PAGE_SIZE)
    } catch {
      setHasMoreMatches(false)
    }
  }, [hasMoreMatches, matches, profileUserId, user])

  const handleSelectOnlineMatch = useCallback(
    async (match: OnlineMatchSummary) => {
      if (user === null || !match.playerUserIds.includes(user.id)) {
        return
      }

      try {
        const detail = await openProfileMatchDetail(user.id, match.id)
        if (detail?.session !== null && detail?.session !== undefined) {
          const opponentName = resolveHumanPlayerName(detail.opponentDisplayName)
          setSelectedOnlineMatch(null)
          setSelectedSession(
            decorateOnlineSessionForViewer(
              detail.session,
              user.id,
              profile?.displayName,
              opponentName,
            ),
          )
          return
        }

        setSelectedSession(null)
        setSelectedOnlineMatch({
          ...(detail ?? { ...match, scorecardVersion: 1, session: null }),
          resultLabel: match.resultLabel,
        })
      } catch {
        setSelectedSession(null)
        setSelectedOnlineMatch({ ...match, scorecardVersion: 1, session: null })
      }
    },
    [profile?.displayName, user],
  )

  if (!validUserId) {
    return (
      <ContentContainer>
        <Box py={10}>
          <Text color="whiteAlpha.800">That player profile link is not valid.</Text>
        </Box>
      </ContentContainer>
    )
  }

  if (!isSignedIn) {
    return (
      <ContentContainer>
        <Box py={{ base: 6, md: 10 }} maxW="720px" w="full" mx="auto">
          <Stack gap={4}>
            <Heading as="h1" size="2xl" color="white" fontFamily="Archivo Black, sans-serif">
              Player profile
            </Heading>
            <Text color="whiteAlpha.800">
              {isSignInEnabled
                ? 'Sign in to view player profiles.'
                : 'Player profiles are on opendart.app.'}
            </Text>
            {isSignInEnabled && isConfigured ? (
              <Button
                variant="cta"
                alignSelf="start"
                onClick={() => {
                  setSignInDialogOpen(true)
                }}
              >
                Sign in
              </Button>
            ) : null}
          </Stack>
          <SignInDialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen} />
        </Box>
      </ContentContainer>
    )
  }

  const displayName = stats?.displayName ?? (isOwnProfile ? profile?.displayName : null) ?? 'Player'

  return (
    <ContentContainer>
      <Box py={{ base: 6, md: 10 }} pb={10} maxW="720px" w="full" mx="auto">
        <Stack gap={8}>
          <Stack gap={3}>
            <Stack direction="row" align="center" gap={2}>
              <Heading as="h1" size="2xl" color="white" fontFamily="Archivo Black, sans-serif">
                {displayName}
              </Heading>
              {isOwnProfile ? (
                <Button
                  aria-label="Edit name"
                  variant="ghost"
                  color="whiteAlpha.800"
                  minW={toolbarControlSize}
                  w={toolbarControlSize}
                  h={toolbarControlSize}
                  p={0}
                  _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                  onClick={() => {
                    setDisplayNameDialogOpen(true)
                  }}
                >
                  <FontAwesomeIcon icon={faPen} />
                </Button>
              ) : null}
            </Stack>
            <Text color="whiteAlpha.700" fontSize="sm">
              <RouterLink to="/history">Back to history</RouterLink>
            </Text>
          </Stack>

          {isOwnProfile ? (
            <DisplayNameEditor
              open={displayNameDialogOpen}
              onOpenChange={setDisplayNameDialogOpen}
              currentName={displayName}
              onSaved={(nextName) => {
                setDisplayName(nextName)
                setStats((current) =>
                  current === null ? current : { ...current, displayName: nextName },
                )
              }}
            />
          ) : (
            <Stack gap={3} align="start">
              <Stack direction="row" gap={2} flexWrap="wrap">
                <ProfileFollowButton profileUserId={profileUserId} />
                <Button
                  variant="cancel"
                  onClick={() => {
                    void (async () => {
                      const ok = await reportDisplayName(profileUserId)
                      setReportMessage(
                        ok
                          ? 'Thanks. We received your report.'
                          : 'Could not send the report. Try again later.',
                      )
                    })()
                  }}
                >
                  Report name
                </Button>
              </Stack>
              {reportMessage !== null ? (
                <Text fontSize="sm" color="whiteAlpha.700">
                  {reportMessage}
                </Text>
              ) : null}
            </Stack>
          )}

          {loadingStats ? <Text color="whiteAlpha.700">Loading stats…</Text> : null}
          {statsError !== null ? <Text color="red.300">{statsError}</Text> : null}

          {stats !== null && profileHasAnyStats(stats) ? (
            <Stack gap={8}>
              {stats.fiveOhOne !== null ? (
                <ProfileStatSection
                  title="501"
                  windowLabel="Last 30 days"
                  rows={buildFiveOhOneRows(stats.fiveOhOne)}
                />
              ) : null}
              {stats.bob27 !== null ? (
                <ProfileStatSection
                  title="Bob's 27"
                  windowLabel="Last 30 days"
                  rows={buildBob27Rows(stats.bob27)}
                />
              ) : null}
              {stats.ninetyNineDarts !== null ? (
                <ProfileStatSection
                  title="99 Darts"
                  windowLabel="Last 30 days"
                  rows={buildNinetyNineRows(stats.ninetyNineDarts)}
                />
              ) : null}
              {stats.bigNumbers !== null ? (
                <ProfileStatSection
                  title="Big Numbers"
                  windowLabel="Last 30 days"
                  rows={buildBigNumbersRows(stats.bigNumbers)}
                />
              ) : null}
              {stats.jdcChallenge !== null ? (
                <Stack gap={3}>
                  {stats.jdcChallenge.badge !== null ? (
                    <ProfileJdcChallengeBadge badge={stats.jdcChallenge.badge} />
                  ) : null}
                  <ProfileStatSection
                    title="JDC Challenge"
                    windowLabel="Last 30 days"
                    rows={buildJdcChallengeRows(stats.jdcChallenge)}
                  />
                </Stack>
              ) : null}
            </Stack>
          ) : !loadingStats && statsError === null ? (
            <Text color="whiteAlpha.700">No public stats in the last 30 days yet.</Text>
          ) : null}

          <Stack gap={3}>
            <Heading as="h2" size="lg" color="white" fontFamily="Archivo Black, sans-serif">
              Online history
            </Heading>
            <HistoryList
              entries={historyEntries}
              hasMore={hasMoreMatches}
              onLoadMore={() => {
                void handleLoadMore()
              }}
              onSelectSession={() => undefined}
              onSelectOnlineMatch={(match) => {
                void handleSelectOnlineMatch(match)
              }}
            />
          </Stack>
        </Stack>
      </Box>
      <SessionSummaryDialog
        open={selectedSession !== null}
        session={selectedSession}
        onClose={() => {
          setSelectedSession(null)
        }}
      />
      <OnlineMatchSummaryDialog
        open={selectedOnlineMatch !== null}
        match={selectedOnlineMatch}
        onClose={() => {
          setSelectedOnlineMatch(null)
        }}
      />
    </ContentContainer>
  )
}
