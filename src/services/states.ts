import { createContextState } from 'foxact/create-context-state'

const [ThemeModeProvider, useThemeMode, useSetThemeMode] = createContextState<
  'light' | 'dark'
>()

const [ThemePaletteProvider, useThemePalette, useSetThemePalette] =
  createContextState<'red' | 'blue' | 'green' | 'beige'>()

// save the state of each profile item loading
const [LoadingCacheProvider, useLoadingCache, useSetLoadingCache] =
  createContextState<Set<string>>(new Set())

// save update state
const [UpdateStateProvider, useUpdateState, useSetUpdateState] =
  createContextState<boolean>(false)

export {
  ThemeModeProvider,
  useThemeMode,
  useSetThemeMode,
  ThemePaletteProvider,
  useThemePalette,
  useSetThemePalette,
  LoadingCacheProvider,
  useLoadingCache,
  useSetLoadingCache,
  UpdateStateProvider,
  useUpdateState,
  useSetUpdateState,
}
