import { describe, expect, it } from 'vitest'
import { HistoryEntrySource } from './onlineHistorySummary'
import { isDeletableHistoryEntry } from './isDeletableHistoryEntry'

describe('isDeletableHistoryEntry', () => {
  it('allows local history entries', () => {
    expect(isDeletableHistoryEntry(HistoryEntrySource.Local)).toBe(true)
  })

  it('rejects online history entries', () => {
    expect(isDeletableHistoryEntry(HistoryEntrySource.Online)).toBe(false)
  })
})
