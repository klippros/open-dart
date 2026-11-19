import type { AppGameController } from '@open-dart/game/game/createSession'
import { toCheckoutSuggestionRules } from '@open-dart/game/game/gameConfigGuards'
import { isCheckoutPossible } from '@open-dart/game/checkout/checkoutSuggestions'
import { capitalizeCallout, numberToWords } from './numberToWords'

export const buildVisitStartCallout = (controller: AppGameController): string | null => {
  const { mode, config } = controller.session
  const rules = toCheckoutSuggestionRules(mode, config)

  if (rules === null) {
    return null
  }

  const activeEntry = controller.scoreboard.players.find((player) => player.isActive)

  if (activeEntry === undefined) {
    return null
  }

  if (!isCheckoutPossible(activeEntry.primaryScore, rules)) {
    return null
  }

  return capitalizeCallout(`You require ${numberToWords(activeEntry.primaryScore)}.`)
}
