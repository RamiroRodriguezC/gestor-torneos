import { Box, Typography } from '@mui/material'
import Construction from '@mui/icons-material/Construction'
import Build from '@mui/icons-material/Build'
import RocketLaunch from '@mui/icons-material/RocketLaunch'

const STATUS_CONFIG = {
  development: {
    icon: Construction,
    color: '#ffab00',
    defaultMessage: 'Esta sección está en desarrollo y estará disponible pronto.',
  },
  maintenance: {
    icon: Build,
    color: '#29b6f6',
    defaultMessage: 'Esta sección está en mantenimiento. Volverá a estar disponible en breve.',
  },
  coming_soon: {
    icon: RocketLaunch,
    color: '#66bb6a',
    defaultMessage: 'Próximamente disponible.',
  },
}

const sizes = {
  sm: { iconSize: 56, spacing: 2, py: 4, fontSize: '1rem', subSize: '0.85rem' },
  md: { iconSize: 80, spacing: 3, py: 6, fontSize: '1.25rem', subSize: '1rem' },
  lg: { iconSize: 104, spacing: 4, py: 8, fontSize: '1.5rem', subSize: '1.1rem' },
}

export default function UnderConstruction({ feature, status = 'development', message, icon: IconOverride, size = 'md' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.development
  const Icon = IconOverride || config.icon
  const s = sizes[size] || sizes.md

  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        py: s.py, px: 2, textAlign: 'center',
      }}
    >
      <Icon sx={{ fontSize: s.iconSize, color: config.color, mb: s.spacing }} />

      {feature && (
        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: s.fontSize, color: 'grey.100', mb: 0.5 }}>
          {feature}
        </Typography>
      )}

      <Typography variant="body1" sx={{ fontSize: s.subSize, color: 'grey.500', maxWidth: 480 }}>
        {message || config.defaultMessage}
      </Typography>
    </Box>
  )
}
