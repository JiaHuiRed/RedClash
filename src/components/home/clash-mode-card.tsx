import {
  DirectionsRounded,
  LanguageRounded,
  MultipleStopRounded,
  RefreshRounded,
  WarningAmberRounded,
} from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useLockFn } from 'ahooks'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { closeAllConnections } from 'tauri-plugin-mihomo-api'

import { useVerge } from '@/hooks/use-verge'
import {
  useAppRefreshers,
  useClashConfigData,
  useCoreDataStatus,
} from '@/providers/app-data-context'
import { patchClashMode, restartCore } from '@/services/cmds'
import type { TranslationKey } from '@/types/generated/i18n-keys'

const CLASH_MODES = ['rule', 'global', 'direct'] as const
type ClashMode = (typeof CLASH_MODES)[number]

const isClashMode = (mode: string): mode is ClashMode =>
  (CLASH_MODES as readonly string[]).includes(mode)

const MODE_META: Record<
  ClashMode,
  { label: TranslationKey; description: TranslationKey }
> = {
  rule: {
    label: 'home.components.clashMode.labels.rule',
    description: 'home.components.clashMode.descriptions.rule',
  },
  global: {
    label: 'home.components.clashMode.labels.global',
    description: 'home.components.clashMode.descriptions.global',
  },
  direct: {
    label: 'home.components.clashMode.labels.direct',
    description: 'home.components.clashMode.descriptions.direct',
  },
}

export const ClashModeCard = () => {
  const { t } = useTranslation()
  const { verge } = useVerge()
  const { clashConfig, isClashConfigFetching } = useClashConfigData()
  const { isCoreDataPending } = useCoreDataStatus()
  const { refreshClashConfig, refreshAll } = useAppRefreshers()

  const [isRetrying, setIsRetrying] = useState(false)

  // 支持的模式列表
  const modeList = CLASH_MODES

  // 直接使用API返回的模式，不维护本地状态
  const currentMode = clashConfig?.mode?.toLowerCase()
  const currentModeKey =
    typeof currentMode === 'string' && isClashMode(currentMode)
      ? currentMode
      : undefined

  const isError =
    !isCoreDataPending && !isClashConfigFetching && !currentModeKey

  const modeDescription = useMemo(() => {
    if (currentModeKey) return t(MODE_META[currentModeKey].description)
    if (isCoreDataPending) return '\u00A0'
    return null
  }, [currentModeKey, isCoreDataPending, t])

  const handleRetry = useLockFn(async () => {
    setIsRetrying(true)
    try {
      await restartCore()
      await refreshAll()
    } catch {
      await refreshClashConfig()
    } finally {
      setIsRetrying(false)
    }
  })

  // 模式图标映射
  const modeIcons = useMemo(
    () => ({
      rule: <MultipleStopRounded fontSize="small" />,
      global: <LanguageRounded fontSize="small" />,
      direct: <DirectionsRounded fontSize="small" />,
    }),
    [],
  )

  // 切换模式的处理函数
  const onChangeMode = useLockFn(async (mode: ClashMode) => {
    if (mode === currentModeKey) return
    if (verge?.auto_close_connection) {
      closeAllConnections()
    }

    try {
      await patchClashMode(mode)
      // 使用共享的刷新方法
      refreshClashConfig()
    } catch (error) {
      console.error('Failed to change mode:', error)
    }
  })

  // 按钮样式
  const buttonStyles = (mode: ClashMode) => ({
    cursor: 'pointer',
    px: 2,
    py: 1.2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    bgcolor: mode === currentModeKey ? 'primary.main' : 'background.paper',
    color: mode === currentModeKey ? 'primary.contrastText' : 'text.primary',
    borderRadius: 1.5,
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    overflow: 'visible',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: 1,
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
    '&::after':
      mode === currentModeKey
        ? {
            content: '""',
            position: 'absolute',
            bottom: -16,
            left: '50%',
            width: 2,
            height: 16,
            bgcolor: 'primary.main',
            transform: 'translateX(-50%)',
          }
        : {},
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 模式选择按钮组 */}
      <Stack
        direction="row"
        spacing={1}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 1,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {modeList.map((mode) => (
          <Paper
            key={mode}
            elevation={mode === currentModeKey ? 2 : 0}
            onClick={() => onChangeMode(mode)}
            sx={buttonStyles(mode)}
          >
            {modeIcons[mode]}
            <Typography
              variant="body2"
              sx={{
                textTransform: 'capitalize',
                fontWeight: mode === currentModeKey ? 600 : 400,
              }}
            >
              {t(MODE_META[mode].label)}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {/* 说明文本 / 错误状态 */}
      <Box
        sx={{ width: '100%', my: 1, display: 'flex', justifyContent: 'center' }}
      >
        {isError ? (
          // 通信错误：警告样式 + 重试按钮
          <Box
            sx={{
              width: '95%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              p: 0.8,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'warning.main',
              bgcolor: ({ palette }) =>
                palette.mode === 'dark'
                  ? 'rgba(255,152,0,0.08)'
                  : 'rgba(255,152,0,0.06)',
            }}
          >
            <WarningAmberRounded
              sx={{ fontSize: 14, color: 'warning.main', flexShrink: 0 }}
            />
            <Typography
              variant="caption"
              sx={{ color: 'warning.main', lineHeight: 1.4 }}
            >
              {t('home.components.clashMode.errors.communication')}
            </Typography>
            <Tooltip title={t('shared.actions.retry')} arrow>
              <IconButton
                size="small"
                onClick={handleRetry}
                disabled={isRetrying}
                sx={{ ml: 0.5, p: 0.25, color: 'warning.main' }}
              >
                {isRetrying ? (
                  <CircularProgress size={12} color="inherit" />
                ) : (
                  <RefreshRounded sx={{ fontSize: 14 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        ) : modeDescription ? (
          // 正常模式描述（无边框、低调）
          <Typography
            variant="caption"
            sx={{
              width: '95%',
              textAlign: 'center',
              color: 'text.secondary',
              p: 0.8,
              borderRadius: 1,
              bgcolor: ({ palette }) =>
                palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.03)',
            }}
          >
            {modeDescription}
          </Typography>
        ) : null}
      </Box>
    </Box>
  )
}
