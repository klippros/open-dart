import { readEnvironmentVariable } from '../env'
import { isKlipprosHost, readBrowserHostname } from '../klipprosHost'
import { isSupabaseConfigured } from '../supabase/client'

export const matchServerUrl = readEnvironmentVariable(import.meta.env.VITE_MATCH_SERVER_URL)

export const isMatchServerConfigured = matchServerUrl !== undefined

export const resolveOnlineMatchesEnabled = (
  supabaseConfigured: boolean,
  matchServerConfigured: boolean,
): boolean => supabaseConfigured && matchServerConfigured

export const isOnlineMatchesEnabled =
  !isKlipprosHost(readBrowserHostname()) &&
  resolveOnlineMatchesEnabled(isSupabaseConfigured, isMatchServerConfigured)
