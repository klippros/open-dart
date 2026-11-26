import { createBrowserRouter, Navigate } from 'react-router-dom'
import { App } from './App'
import { AroundTheClockSetupPage } from './routes/AroundTheClockSetupPage'
import { BigNumbersSetupPage } from './routes/BigNumbersSetupPage'
import { ClaimTheBoardSetupPage } from './routes/ClaimTheBoardSetupPage'
import { BullRunSetupPage } from './routes/BullRunSetupPage'
import { HunterSetupPage } from './routes/HunterSetupPage'
import { AuthCallbackPage } from './routes/AuthCallbackPage'
import { GamePage } from './routes/GamePage'
import { HomePage } from './routes/HomePage'
import { ImpressumPage } from './routes/ImpressumPage'
import { PrivacyPolicyPage } from './routes/PrivacyPolicyPage'
import { MatchSetupPage } from './routes/MatchSetupPage'
import { NinetyNineDartsSetupPage } from './routes/NinetyNineDartsSetupPage'
import { OnlineMatchJoinPage } from './routes/OnlineMatchJoinPage'
import { OnlineMatchNewPage } from './routes/OnlineMatchNewPage'
import { OnlineMatchPage } from './routes/OnlineMatchPage'
import { OwnProfileRoute } from './routes/OwnProfileRoute'
import { PlayPage } from './routes/PlayPage'
import { PlayerProfilePage } from './routes/PlayerProfilePage'
import { X01SetupPage } from './routes/X01SetupPage'
import { LEGACY_PROFILE_PATHS, OWN_PROFILE_PATH } from './lib/profile/profileRoutes'

export const router = createBrowserRouter(
  [
    {
      element: <App />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'play', element: <PlayPage /> },
        { path: 'game', element: <GamePage /> },
        { path: 'game/match-setup', element: <MatchSetupPage /> },
        { path: 'game/setup', element: <X01SetupPage /> },
        { path: 'game/around-the-clock/setup', element: <AroundTheClockSetupPage /> },
        { path: 'game/claim-the-board/setup', element: <ClaimTheBoardSetupPage /> },
        { path: 'game/hunter/setup', element: <HunterSetupPage /> },
        { path: 'game/bull-run/setup', element: <BullRunSetupPage /> },
        { path: 'game/99-darts/setup', element: <NinetyNineDartsSetupPage /> },
        { path: 'game/big-numbers/setup', element: <BigNumbersSetupPage /> },
        { path: 'match/new', element: <OnlineMatchNewPage /> },
        { path: 'match/join/:token', element: <OnlineMatchJoinPage /> },
        { path: 'match/:id', element: <OnlineMatchPage /> },
        { path: 'auth/callback', element: <AuthCallbackPage /> },
        { path: OWN_PROFILE_PATH, element: <OwnProfileRoute /> },
        ...LEGACY_PROFILE_PATHS.map((path) => ({
          path,
          element: <Navigate to={OWN_PROFILE_PATH} replace />,
        })),
        { path: 'players/:userId', element: <PlayerProfilePage /> },
        { path: 'about', element: <Navigate to="/" replace /> },
        { path: 'impressum', element: <ImpressumPage /> },
        { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      ],
    },
  ],
  { basename: '/' },
)
