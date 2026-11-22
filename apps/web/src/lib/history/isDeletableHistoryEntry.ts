import { HistoryEntrySource } from './onlineHistorySummary'

export const isDeletableHistoryEntry = (source: HistoryEntrySource): boolean =>
  source === HistoryEntrySource.Local
