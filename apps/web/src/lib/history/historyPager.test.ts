import { describe, expect, it } from 'vitest'
import { HISTORY_PAGE_SIZE, takeHistoryPage } from './historyPager'

const entry = (id: string, sortAt: string) => ({ id, sortAt })

describe('takeHistoryPage', () => {
  const entries = Array.from({ length: 35 }, (_, index) =>
    entry(`local-${index}`, `2026-01-01T00:00:${String(index).padStart(2, '0')}.000Z`),
  )

  it('returns the first page and reports more entries', () => {
    const page = takeHistoryPage(entries)
    expect(page.entries).toHaveLength(HISTORY_PAGE_SIZE)
    expect(page.entries[0]?.id).toBe('local-0')
    expect(page.hasMore).toBe(true)
  })

  it('returns every entry once the limit covers the list', () => {
    expect(takeHistoryPage(entries, 60)).toEqual({ entries, hasMore: false })
    expect(takeHistoryPage([], 30)).toEqual({ entries: [], hasMore: false })
  })

  it('treats a non-positive limit as an empty page', () => {
    expect(takeHistoryPage(entries, 0)).toEqual({ entries: [], hasMore: true })
  })
})
