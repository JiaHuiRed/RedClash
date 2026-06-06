import { Button, ButtonGroup } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { defaultThemePalette, themePalettes } from '@/pages/_theme'

type ThemePalette = IVergeConfig['theme_palette']

interface Props {
  value?: ThemePalette
  onChange?: (value: ThemePalette) => void
}

export const ThemePaletteSwitch = (props: Props) => {
  const { value, onChange } = props
  const { t } = useTranslation()

  const palettes = themePalettes

  return (
    <ButtonGroup size="small" sx={{ my: '4px', flexWrap: 'wrap' }}>
      {palettes.map((p) => (
        <Button
          key={p.value}
          variant={p.value === (value ?? defaultThemePalette) ? 'contained' : 'outlined'}
          onClick={() => onChange?.(p.value as ThemePalette)}
          sx={{ textTransform: 'none' }}
        >
          {t(`settings.sections.appearance.palettes.${p.value}`)}
        </Button>
      ))}
    </ButtonGroup>
  )
}
