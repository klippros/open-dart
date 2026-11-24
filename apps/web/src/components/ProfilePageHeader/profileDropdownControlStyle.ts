import type { CSSProperties } from 'react'

const SELECT_INSET = '12px'

const caretSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
)

/** Shared chrome for profile selects and select-like menus (date range, Following). */
export const profileDropdownControlStyle = {
  appearance: 'none',
  WebkitAppearance: 'none',
  padding: `8px 36px 8px ${SELECT_INSET}`,
  borderRadius: '6px',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.3)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backgroundImage: `url("data:image/svg+xml,${caretSvg}")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: `right ${SELECT_INSET} center`,
  backgroundSize: '12px 12px',
  color: 'white',
  fontSize: '0.875rem',
} as const satisfies CSSProperties

export const profileDropdownControlHoverStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.16)',
  borderColor: 'rgba(255, 255, 255, 0.45)',
} as const satisfies CSSProperties
