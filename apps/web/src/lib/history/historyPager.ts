export const HISTORY_PAGE_SIZE = 30

export interface HistorySortableEntry {
  id: string
  sortAt: string
}

export interface HistoryPageSlice<T extends HistorySortableEntry> {
  entries: T[]
  hasMore: boolean
}

export const takeHistoryPage = <T extends HistorySortableEntry>(
  entries: readonly T[],
  limit: number = HISTORY_PAGE_SIZE,
): HistoryPageSlice<T> => ({
  entries: entries.slice(0, Math.max(limit, 0)),
  hasMore: entries.length > Math.max(limit, 0),
})
