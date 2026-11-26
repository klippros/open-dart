const ALLOW_HOME_KEY = 'opendart-allow-home'

export const markAllowHome = (): void => {
  sessionStorage.setItem(ALLOW_HOME_KEY, '1')
}

export const hasAllowHome = (): boolean => sessionStorage.getItem(ALLOW_HOME_KEY) === '1'

export const clearAllowHome = (): void => {
  sessionStorage.removeItem(ALLOW_HOME_KEY)
}
