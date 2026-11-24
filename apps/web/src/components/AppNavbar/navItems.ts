import { OWN_PROFILE_PATH } from '../../lib/profile/profileRoutes'

export interface NavItemConfig {
  to: string
  label: string
  beta?: boolean
}

export const NAV_ITEMS: readonly NavItemConfig[] = [
  { to: '/', label: 'Play' },
  { to: OWN_PROFILE_PATH, label: 'Profile' },
  { to: '/about', label: 'About' },
]
