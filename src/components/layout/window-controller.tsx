import { Box } from '@mui/material'
import { forwardRef, useImperativeHandle } from 'react'

import { useWindowControls } from '@/hooks/use-window'

const SIZE = 13
const GAP = 8

// 基础圆点样式
const baseDot = {
  width: SIZE,
  height: SIZE,
  borderRadius: '50%',
  cursor: 'default',
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '0.5px solid rgba(0,0,0,0.22)',
  transition: 'filter 100ms ease',
  position: 'relative' as const,
  padding: 0,
  outline: 'none',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  background: 'none',
  '&:hover': { filter: 'brightness(1.25)' },
}

// 符号层：始终可见
const symbolStyle: React.CSSProperties = {
  position: 'absolute',
  fontSize: 8,
  fontWeight: 900,
  lineHeight: 1,
  color: 'rgba(0,0,0,0.55)',
  userSelect: 'none',
  pointerEvents: 'none',
}

export const WindowControls = forwardRef(function WindowControls(props, ref) {
  const {
    currentWindow,
    maximized,
    minimize,
    close,
    toggleFullscreen,
    toggleMaximize,
  } = useWindowControls()

  useImperativeHandle(
    ref,
    () => ({
      currentWindow,
      maximized,
      minimize,
      close,
      toggleFullscreen,
      toggleMaximize,
    }),
    [
      currentWindow,
      maximized,
      minimize,
      close,
      toggleFullscreen,
      toggleMaximize,
    ],
  )

  return (
    <Box
      sx={{
        display: 'flex',
        gap: `${GAP}px`,
        alignItems: 'center',
        height: SIZE,
        px: 1,
      }}
    >
      {/* 关闭 */}
      <Box
        component="button"
        aria-label="close"
        sx={{ ...baseDot, background: '#FF5F57' }}
        onClick={close}
      >
        <span style={symbolStyle}>✕</span>
      </Box>

      {/* 最小化 */}
      <Box
        component="button"
        aria-label="minimize"
        sx={{ ...baseDot, background: '#FEBC2E' }}
        onClick={minimize}
      >
        <span style={symbolStyle}>−</span>
      </Box>

      {/* 最大化 */}
      <Box
        component="button"
        aria-label="maximize"
        sx={{ ...baseDot, background: '#28C840' }}
        onClick={toggleMaximize}
      >
        <span style={{ ...symbolStyle, fontSize: 7 }}>⤢</span>
      </Box>
    </Box>
  )
})
