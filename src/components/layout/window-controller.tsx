import { Box } from '@mui/material'
import { forwardRef, useImperativeHandle } from 'react'

import { useWindowControls } from '@/hooks/use-window'

const SIZE = 12
const GAP = 8

const baseDot = {
  width: SIZE,
  height: SIZE,
  borderRadius: '50%',
  cursor: 'default',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '0.5px solid rgba(0, 0, 0, 0.12)',
  transition: 'filter 120ms ease, background 120ms ease',
}

const idle = (color: string) => ({
  background: color,
  filter: 'saturate(0.6) brightness(0.95)',
})

const hover = (color: string) => ({
  background: color,
  filter: 'none',
})

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
    [currentWindow, maximized, minimize, close, toggleFullscreen, toggleMaximize],
  )

  // macOS 风格：3 个交通灯 —— 关闭 / 最小化 / 全屏
  // 未 hover 时饱和度降低（像 macOS 那样），hover 时显原色
  return (
    <Box
      sx={{
        display: 'flex',
        gap: `${GAP}px`,
        alignItems: 'center',
        height: SIZE,
        padding: '0 8px',
      }}
    >
      <Box
        component="button"
        aria-label="close"
        sx={{ ...baseDot, ...idle('#FF5F57') }}
        onClick={close}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, hover('#FF5F57'))}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, idle('#FF5F57'))}
      />
      <Box
        component="button"
        aria-label="minimize"
        sx={{ ...baseDot, ...idle('#FEBC2E') }}
        onClick={minimize}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, hover('#FEBC2E'))}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, idle('#FEBC2E'))}
      />
      <Box
        component="button"
        aria-label="maximize"
        sx={{ ...baseDot, ...idle('#28C840') }}
        onClick={toggleMaximize}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, hover('#28C840'))}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, idle('#28C840'))}
      />
    </Box>
  )
})
