const SELECT_INSET = '12px'
const CARET_SIZE = '12px'

const caretSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
)

/**
 * Closed chrome for every dropdown. The caret is a background image so a
 * select and a menu button share the same inset instead of a browser arrow.
 */
export const dropdownControlCss = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  boxSizing: 'border-box',
  margin: 0,
  padding: `8px calc(${SELECT_INSET} + ${CARET_SIZE} + ${SELECT_INSET}) 8px ${SELECT_INSET}`,
  borderRadius: '6px',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.3)',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backgroundImage: `url("data:image/svg+xml,${caretSvg}")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: `right ${SELECT_INSET} center`,
  backgroundSize: `${CARET_SIZE} ${CARET_SIZE}`,
  color: 'white',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  fontWeight: 400,
  lineHeight: '1.25rem',
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover:not(:disabled), &[data-state="open"]': {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineOffset: '2px',
    outlineColor: 'var(--chakra-colors-orange-300)',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'default',
  },
  '&::-ms-expand': {
    display: 'none',
  },
} as const
