import { Box, Heading, Link, Stack, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { ContentContainer } from '../components/ContentContainer'

const mailLink = (
  <Link href="mailto:opendart@klippros.com" color="whiteAlpha.900" textDecoration="underline">
    opendart@klippros.com
  </Link>
)

export const PrivacyPolicyPage = () => (
  <ContentContainer>
    <Box py={{ base: 6, md: 10 }} pb={10}>
      <Stack gap={8} maxW="720px" w="full" mx="auto">
        <Stack gap={3}>
          <Heading as="h1" size="2xl" color="white" fontFamily="Archivo Black, sans-serif">
            Privacy Policy for Open Dart
          </Heading>
          <Text color="whiteAlpha.700" fontSize="sm" lineHeight="1.65">
            Effective date: 25 November 2026
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Introduction
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            This Privacy Policy applies to the hosted Open Dart service at{' '}
            <Link href="https://opendart.app/" color="whiteAlpha.900" textDecoration="underline">
              opendart.app
            </Link>
            , operated by Klippros Studios AB (Södra Viktoriagatan 46A, 411 30 Gothenburg, Sweden,
            company registration number 559543-6857). Open Dart is an open-source browser darts
            scoring app. You can play without an account. Optional sign-in syncs completed games and
            unlocks online matches, follows, invites, and player profiles.
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Self-hosted copies of the open-source software are run by whoever hosts them. This
            policy covers only the service we operate at opendart.app. We do not sell personal
            information and we do not use advertising or product-analytics SDKs in the app.
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            For privacy questions, access or deletion requests, contact {mailLink}.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            What information do we process?
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            We process only what is needed to run Open Dart, keep the service secure, and show the
            social features described below.
          </Text>
          <Heading as="h3" size="md" color="white">
            Playing without an account
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            In-progress and completed games stay in your browser (local storage). No Open Dart
            account is required. Clearing site data or using another device removes or hides that
            local history. Guest names you type into a local scorecard stay on your device unless
            you later sign in and sync that completed game.
          </Text>
          <Heading as="h3" size="md" color="white">
            Account and sign-in
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Sign-in is optional and uses an email magic link or Google. We do not store a password.
            Supabase Auth stores your email address, user id, and session tokens. If you use Google,
            Google processes the sign-in; we receive your email and may use your Google profile name
            only as the starting display name. Your email appears in your account menu and is not
            shown on profiles.
          </Text>
          <Heading as="h3" size="md" color="white">
            Private synced practice and local history
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            When you are signed in, completed games can sync to your account as private game
            sessions (full scorecards, including any guest names you entered). Do not enter another
            person&apos;s full legal name without permission. Your private history and detailed
            stats stay available to your account. Other players do not see throw-by-throw practice
            scorecards.
          </Text>
          <Heading as="h3" size="md" color="white">
            Profiles, online matches, and stats visible to signed-in users
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Other signed-in Open Dart users can see your display name, online match summaries
            (participants&apos; names, mode, result, and date), and a limited profile-stats snapshot
            for the last 30 days measured from the time the page is loaded. That snapshot shows
            averages, bests, and related summary figures for x01 matches and key practice modes—for
            example 501 averages and checkout rate, or practice scores and hit rates—not
            throw-by-throw scorecards. The exact modes and metrics may change as we improve
            profiles; the examples above are not a complete list. Extra detail on your own profile
            stays with your account and is not shown on other players&apos; views of you. Logged-out
            visitors are not given these profile views, and profile pages ask search engines not to
            index them.
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Throw-by-throw online scorecards are available to the players in that match. There is no
            chat. Live play runs on our Cloudflare match server; when a match ends, the result is
            stored in Supabase.
          </Text>
          <Heading as="h3" size="md" color="white">
            Follows, invites, and moderation
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Follow lists are visible to the follower. Match invites are visible to the inviter and
            invitee. Reports of offensive display names are kept for moderation and are not shown to
            other players.
          </Text>
          <Heading as="h3" size="md" color="white">
            Voice scoring
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Optional voice scoring uses your microphone and on-device speech recognition. We do not
            receive your audio. Granting microphone access in the browser is a device permission; it
            is not consent for us to process audio on our servers.
          </Text>
          <Heading as="h3" size="md" color="white">
            Technical and security data
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Our hosts process standard technical data such as IP address, timestamps, and security
            or delivery logs when you use the site, Auth, or the match server. We also keep
            short-lived rate-limit counters to reduce abuse.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Who can see what?
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Online match summaries and profile stats are visible to authenticated Open Dart users,
            not to the general public without signing in. Full private practice history stays on the
            account. Opponents keep a copy of shared match results in their history.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Third-party services
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            We use processors and independent providers only as needed to run the service: Supabase
            (Auth, database, and invite realtime) hosts project data in West EU (Ireland).
            Cloudflare hosts the website and the live match Worker on its global edge network,
            including IP and security logs; that is not a single fixed region like the database.
            Google processes optional Google sign-in. Each provider acts under its own terms for the
            parts of the service it provides.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Why we process data (legal bases)
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Where processing is objectively necessary to provide the account, sync, online play,
            follows, invites, or profiles you request, we rely on performance of that service. We
            rely on legitimate interests for security, rate limiting, display-name moderation, and
            preserving an opponent&apos;s anonymized match record after an account is closed,
            subject to your right to object. Device permissions (such as the microphone) are handled
            by your browser and are separate from these legal bases.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            How long we keep data
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Account, profile, private synced sessions, follows, invites, reports, and rate-limit
            rows tied to your user id are kept while the account exists and are removed when we
            complete an account-deletion request, subject to the match-history rule below.
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Completed or cancelled online matches are kept so both players retain a shared result.
            After account deletion we keep the match with the label “Deleted player”, without your
            email or sign-in identity. Pending invites last until accepted, declined, superseded, or
            deleted with the account. Rate-limit counters use short rolling windows (on the order of
            a minute) and are removed with the account.
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Live match state on the Cloudflare Durable Object is held only while the match is in
            progress and is not kept as a separate long-term store after the result is written to
            Supabase. Operational logs at Cloudflare and Supabase are retained and rotated under
            each provider&apos;s account settings. Database backups follow Supabase&apos;s backup
            schedule for the project and are not restored for ordinary use after deletion.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Your rights
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Depending on applicable law, you may request access, correction, deletion, restriction,
            portability, or objection to processing based on legitimate interests. Practical options
            include:
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            • Export local browser history with the in-app JSON export
            <br />• Email {mailLink} to request a copy of the personal data we hold for
            you—including synced games and online match records—or to ask for correction or deletion
            <br />
            • Clear site data or stop using the service to remove local-only data
            <br />• Revoke microphone access in your browser settings if you used voice scoring
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            We aim to respond to valid privacy and account-deletion requests within 30 days. You may
            lodge a complaint with Integritetsskyddsmyndigheten (IMY) in Sweden or with your local
            data-protection authority.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Account deletion
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Account deletion is not built into the app yet. Email {mailLink} from the address on the
            account. We verify the request in a proportionate way and do not require you to sign
            back into the app if the email evidence is enough. We aim to complete valid deletion
            requests within 30 days.
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            When we delete an account we remove the Auth user (email and Google identity), profile,
            private synced sessions, follows, and invites. Online matches you played are kept for
            the opponent with your name and account id removed from stored scorecards and replaced
            by “Deleted player”. Someone who played that match may still know who you were. Retained
            results are therefore treated as pseudonymous personal data kept for the legitimate
            interest of preserving the opponent&apos;s history; you may object, and we assess each
            request under applicable law. Finish or cancel any in-progress online match before
            asking us to delete the account.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            GDPR (European Economic Area and United Kingdom)
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            If you are located in the EEA or the United Kingdom, Klippros Studios AB is the
            controller of personal data processed for opendart.app. You have the right to access,
            rectify, erase, restrict, or port your data, to object to processing based on legitimate
            interests, and to lodge a complaint with a supervisory authority (in Sweden,
            Integritetsskyddsmyndigheten, or your local authority).
          </Text>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Contact {mailLink} to exercise these rights. We aim to respond to valid requests within
            30 days.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            California privacy rights
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            If you are a California resident, the following summarizes rights that may apply under
            CCPA/CPRA and related California law when you use Open Dart.
          </Text>
          <Heading as="h3" size="md" color="white">
            Personal information we process
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Depending on how you use the service, this may include account and sign-in data (such as
            email and user id), display name, private synced game sessions, online match results and
            profile-stats snapshots visible to other signed-in users, follows and invites,
            moderation reports, technical/security logs (such as IP address), and on-device voice
            input that we do not receive.
          </Text>
          <Heading as="h3" size="md" color="white">
            Your rights
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            California residents may have the right to know what personal information is collected,
            request deletion, correct inaccurate information, and not be discriminated against for
            exercising these rights. Open Dart does not sell personal information and does not share
            it for cross-context behavioral advertising. If that ever changes, we will provide a way
            to opt out.
          </Text>
          <Heading as="h3" size="md" color="white">
            How to exercise your rights
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Email {mailLink} with your name, the email on the account if you have one, and a clear
            description of your request. We aim to respond within 30 days, and in any event within
            applicable California timelines (which may allow up to 45 days).
          </Text>
          <Heading as="h3" size="md" color="white">
            Do Not Track
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Open Dart does not track users across third-party apps or websites for advertising, and
            we do not change our practices based on a browser Do Not Track signal.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Children
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Open Dart is not directed at children under 13. If you believe a child under 13 has
            created an account, contact us and we will delete it.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            International transfers
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Primary application data for opendart.app is stored in West EU (Ireland) on Supabase.
            Cloudflare serves the site and live matches from its global edge network (requests may
            be handled in data centers near the user), and Google may process sign-in data in other
            countries. Where a transfer outside the EEA/UK requires safeguards, we rely on the
            provider&apos;s applicable transfer tools (such as Standard Contractual Clauses) or an
            adequacy decision.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Security
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            We use access controls, encrypted connections to our providers, and row-level
            protections in the database so that private sessions stay with the account holder. No
            method of transmission or storage is perfectly secure. Protect your email account and
            devices.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Changes
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            We may update this policy from time to time. The current version will always be
            available at{' '}
            <Link asChild color="whiteAlpha.900" textDecoration="underline">
              <RouterLink to="/privacy-policy">opendart.app/privacy-policy</RouterLink>
            </Link>
            .
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Acknowledgement
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            By using the hosted Open Dart service at opendart.app, you acknowledge the practices
            described in this Privacy Policy.
          </Text>
        </Stack>

        <Stack gap={3}>
          <Heading as="h2" size="xl" color="white" fontFamily="Archivo Black, sans-serif">
            Contact
          </Heading>
          <Text color="whiteAlpha.800" fontSize="md" lineHeight="1.65">
            Klippros Studios AB
            <br />
            Södra Viktoriagatan 46A, 411 30 Gothenburg, Sweden
            <br />
            {mailLink}
          </Text>
          <Text color="whiteAlpha.700" fontSize="sm" lineHeight="1.65">
            Company details are also on the{' '}
            <Link asChild color="whiteAlpha.800" textDecoration="underline">
              <RouterLink to="/impressum">Impressum</RouterLink>
            </Link>
            .
          </Text>
        </Stack>
      </Stack>
    </Box>
  </ContentContainer>
)
